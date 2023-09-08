import type { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';
import { badRequest } from '@hapi/boom';

function indent(str: string, spaces: number) {
  return str
    .split('\n')
    .map(line => ' '.repeat(spaces) + line)
    .join('\n');
}

function extractZodMessage(error: any): string {
  if (Array.isArray(error)) {
    return error.map(extractZodMessage).join('\n');
  } else {
    let union: string[] = [];
    if ('unionErrors' in error) {
      union = error.unionErrors.map(extractZodMessage);
    } else if ('issues' in error) {
      union = error.issues.map(extractZodMessage);
    }
    if (
      'message' in error &&
      typeof error.message === 'string' &&
      !error.message.includes('\n')
    ) {
      if (union.length === 0) return error.message;
      return error.message + '\n' + indent(union.join('\n'), 2);
    } else if (union.length > 0) {
      return union.join('\n');
    } else {
      return '';
    }
  }
}

export async function validate<T extends AnyZodObject>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    return await schema.parseAsync(req);
  } catch (error: any) {
    throw badRequest(extractZodMessage(error));
  }
}

export function wrap(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      return await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

export function log(...args: unknown[]) {
  console.log(`[${process.env.pm_id ?? ''}]`, ...args);
}

export function warn(...args: unknown[]) {
  console.warn(`[${process.env.pm_id ?? ''}]`, ...args);
}

export type Mapper<T> = (t: T) => number;

export function minBy<T>(arr: T[], fn: Mapper<T>) {
  return extremumBy(arr, fn, Math.min);
}

export function maxBy<T>(arr: T[], fn: Mapper<T>) {
  return extremumBy(arr, fn, Math.max);
}

function extremumBy<T>(
  arr: T[],
  pluck: Mapper<T>,
  extremum: (a: number, b: number) => number
): T | null {
  return (
    arr.reduce<[number, T] | null>((best, next) => {
      const pair: [number, T] = [pluck(next), next];
      if (!best) {
        return pair;
      } else if (extremum.apply(null, [best[0], pair[0]]) == best[0]) {
        return best;
      } else {
        return pair;
      }
    }, null)?.[1] ?? null
  );
}
