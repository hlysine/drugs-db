import express from 'express';
import { z } from 'zod';
import { validate, wrap } from '../helper';
import { badRequest } from '@hapi/boom';
import { drugs, fuse } from './data';
import { FullDrugInfo, SearchResult } from '../../drug-types';
import fuzzysort from 'fuzzysort';

const router = express.Router();

router.get(
  '/search',
  wrap(async (req, res) => {
    const {
      query: { q, limit: limitStr, skip: skipStr },
    } = await validate(
      req,
      z.object({
        query: z
          .object({
            q: z.string(),
            limit: z.string().optional(),
            skip: z.string().optional(),
          })
          .strict(),
      })
    );
    let limit = parseInt(limitStr ?? '10', 10);
    const skip = parseInt(skipStr ?? '0', 10);
    if (Number.isNaN(limit) || limit < 1) {
      throw badRequest('Invalid limit');
    }
    if (Number.isNaN(skip) || skip < 0) {
      throw badRequest('Invalid skip');
    }
    limit = Math.min(limit, 100);
    const time = performance.now();
    let results: Readonly<
      (
        | { obj: FullDrugInfo; score: number }
        | { item: FullDrugInfo; score?: number }
      )[]
    > = fuzzysort.go(q, drugs, {
      keys: [
        'proprietaryName',
        'proprietaryNameSuffix',
        'nonProprietaryNames',
        'pharmClasses.className',
        'formulae.substances.substanceName',
      ],
    });
    if (!results[0] || (results[0].score ?? 0) < -1000) {
      results = fuse.search(q);
    }
    console.log(`Search for "${q}" took ${performance.now() - time}ms`);
    const total = results.length;
    const sliced = results.slice(skip, skip + limit).map(r => {
      const { products: _, ...rest } = 'obj' in r ? r.obj : r.item;
      return rest;
    });
    res.status(200).json({
      total,
      items: sliced,
      limit,
      skip,
    } satisfies SearchResult);
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    const {
      params: { id },
    } = await validate(
      req,
      z.object({
        params: z
          .object({
            id: z.string(),
          })
          .strict(),
      })
    );
    const drug = drugs.find(d => d.drugId === id);
    if (!drug) {
      throw badRequest('Drug not found: ' + id);
    }
    res.status(200).json(drug);
  })
);

export default router;
