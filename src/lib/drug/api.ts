import express from 'express';
import { z } from 'zod';
import { log, validate, wrap } from '../helper';
import { badRequest } from '@hapi/boom';
import { drugs, fuse } from './data';
import { FullDrugInfo, SearchResult } from '../../drug-types';
import fuzzysort from 'fuzzysort';
import isEmpty from 'lodash/isEmpty';

const MAX_QUERY_LENGTH = 30;

interface SearchEntry {
  obj: FullDrugInfo;
  score: number;
}

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
    if (isEmpty(q)) {
      return res.status(200).json({
        total: 0,
        items: [],
        limit,
        skip,
        badSearch: false,
      } satisfies SearchResult);
    }
    limit = Math.min(limit, 100);
    const time = performance.now();
    let badSearch = false;
    let results: readonly SearchEntry[] = fuzzysort.go(
      q.slice(0, MAX_QUERY_LENGTH),
      drugs,
      {
        keys: [
          'proprietaryName',
          'proprietaryNameSuffix',
          'nonProprietaryNames',
          'pharmClasses.className',
          'formulae.substances.substanceName',
        ],
      }
    );
    if (!results[0] || results[0].score < -1000) {
      results = fuse
        .search(q.slice(0, MAX_QUERY_LENGTH))
        .map(entry => {
          entry.score! *= Math.pow(0.95, entry.item.pharmClasses.length);
          return { obj: entry.item, score: entry.score! };
        })
        .sort((a, b) => a.score - b.score);
      badSearch = results.length === 0 || results[0].score > 0.3;
    } else {
      results = results
        .map(entry => {
          entry.score += entry.obj.pharmClasses.length;
          return { obj: entry.obj, score: entry.score };
        })
        .sort((a, b) => b.score - a.score);
    }
    log(
      `Search for "${q}" took ${(performance.now() - time).toPrecision(4)}ms`
    );
    const total = results.length;
    const sliced = results.slice(skip, skip + limit).map(r => {
      const { products: _, ...rest } = r.obj;
      return rest;
    });
    return res.status(200).json({
      total,
      items: sliced,
      limit,
      skip,
      badSearch,
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
