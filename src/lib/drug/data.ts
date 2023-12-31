import { parse } from '@vanillaes/csv';
import fs from 'fs/promises';
import { FullDrugInfo, PharmClass, Substance } from '../../drug-types';
import { lineStart } from 'readable-regexp';
import Fuse from 'fuse.js';
import isEmpty from 'lodash/isEmpty';
import { log, warn } from '../helper';

const DATA_DIR = 'dist/fda-data/';

export let drugs: FullDrugInfo[] = [];
export let pharmClasses: string[] = [];
export let fuse: Fuse<FullDrugInfo>;

/**
 * Parse a date in the format YYYYMMDD
 * @param date  Date string in the format YYYYMMDD
 */
function parseDate(date: string): Date {
  const year = parseInt(date.slice(0, 4), 10);
  const month = parseInt(date.slice(4, 6), 10);
  const day = parseInt(date.slice(6, 8), 10);
  return new Date(year, month - 1, day);
}

function parseSubstances(
  name: string,
  numerator: string,
  unit: string
): Substance[] {
  if (isEmpty(name) || isEmpty(numerator) || isEmpty(unit)) {
    return [];
  }
  const names = name.split(';').map(s => s.trim());
  const numerators = numerator.split(';').map(s => s.trim());
  const units = unit.split(';').map(s => s.trim());
  const substances: Substance[] = [];
  for (let i = 0; i < names.length; i++) {
    substances.push({
      substanceName: names[i],
      activeNumeratorStrength: numerators[i],
      activeIngredUnit: units[i],
    });
  }
  return substances;
}

const pharmClassRegex = lineStart.captureAs`className`.oneOrMore.char.exactly`[`
  .captureAs`classType`.oneOrMore.char.exactly`]`.lineEnd.toRegExp();
function parsePharmClasses(classes: string): PharmClass[] {
  if (isEmpty(classes)) {
    return [];
  }
  const lines = classes.split(',');
  const fixed = new Set<string>();
  let line: string[] = [];
  for (const l of lines) {
    line.push(l);
    if (pharmClassRegex.test(l)) {
      fixed.add(line.join(','));
      line = [];
    }
  }
  return [...fixed].map(s => {
    const match = s.trim().match(pharmClassRegex);
    return {
      className: match?.groups?.className?.trim() ?? '',
      classType: match?.groups?.classType?.trim() ?? '',
    };
  });
}

function rowToDrug(
  cache: Map<string, FullDrugInfo>,
  row: string[],
  drugFinished: boolean
): FullDrugInfo {
  const drug: FullDrugInfo = drugFinished
    ? {
        drugFinished,
        drugId: row[0].split('_')[1],
        productTypeName: row[2],
        proprietaryName: row[3],
        proprietaryNameSuffix: isEmpty(row[4]) ? undefined : row[4],
        nonProprietaryNames: row[5].split(',').map(s => s.trim()),
        dosageForms: row[6].split(',').map(s => s.trim()),
        routes: row[7].split(';').map(s => s.trim()),
        applicationNumber: row[11],
        labelerName: row[12],
        products: [
          {
            productNdc: row[1],
            substances: parseSubstances(row[13], row[14], row[15]),
            packages: [],
            startMarketingDate: parseDate(row[8]),
            endMarketingDate: isEmpty(row[9]) ? undefined : parseDate(row[9]),
            marketingCategoryName: row[10],
          },
        ],
        pharmClasses: parsePharmClasses(row[16]),
        deaSchedule: row[17],
      }
    : {
        drugFinished,
        drugId: row[0].split('_')[1],
        productTypeName: row[2],
        proprietaryName: undefined,
        proprietaryNameSuffix: undefined,
        nonProprietaryNames: row[3].split(',').map(s => s.trim()),
        dosageForms: row[4].split(',').map(s => s.trim()),
        routes: [],
        applicationNumber: undefined,
        products: [
          {
            productNdc: row[1],
            substances: parseSubstances(row[9], row[10], row[11]),
            packages: [],
            startMarketingDate: parseDate(row[5]),
            endMarketingDate: isEmpty(row[6]) ? undefined : parseDate(row[6]),
            marketingCategoryName: row[7],
          },
        ],
        labelerName: row[8],
        pharmClasses: [],
        deaSchedule: row[12],
      };
  cache.set(row[0], drug);
  return drug;
}

function rowToPackage(cache: Map<string, FullDrugInfo>, row: string[]) {
  const [productId, _, ndcPackageCode, packageDescription] = row;
  if (!cache.has(productId)) {
    warn(`Drug not found for product ID ${productId}`);
    return;
  }
  cache.get(productId)!.products[0].packages.push({
    ndcPackageCode,
    packageDescription: packageDescription.split('>').map(s => s.trim()),
  });
}

export async function readDrugs(): Promise<void> {
  log('Drug: Reading approved drugs');

  const drugCache = new Map<string, FullDrugInfo>();

  const data = await fs.readFile(DATA_DIR + 'Drugs_product.csv', {
    encoding: 'utf8',
  });

  const parsed = parse(data);
  parsed.shift(); // Remove the header row

  drugs = parsed.map(row => rowToDrug(drugCache, row, true));

  log('Drug: Reading unapproved drugs');

  const unapprovedData = await fs.readFile(
    DATA_DIR + 'Drugs_unfinished_products.csv',
    {
      encoding: 'utf8',
    }
  );

  const unapprovedParsed = parse(unapprovedData);
  unapprovedParsed.shift(); // Remove the header row

  drugs.push(...unapprovedParsed.map(row => rowToDrug(drugCache, row, false)));

  log('Drug: Populating approved drug packaages');

  const packagesData = await fs.readFile(DATA_DIR + 'Drugs_package.csv', {
    encoding: 'utf8',
  });

  const packagesParsed = parse(packagesData);
  packagesParsed.shift(); // Remove the header row

  packagesParsed.forEach(row => rowToPackage(drugCache, row));

  log('Drug: Populating unapproved drug packaages');

  const unapprovedPackagesData = await fs.readFile(
    DATA_DIR + 'Drugs_unfinished_package.csv',
    {
      encoding: 'utf8',
    }
  );

  const unapprovedPackagesParsed = parse(unapprovedPackagesData);
  unapprovedPackagesParsed.shift(); // Remove the header row

  unapprovedPackagesParsed.forEach(row => rowToPackage(drugCache, row));

  log('Drug: Merge identical drugs with different formulae');

  const mergedDrugs = new Map<string, FullDrugInfo>();
  drugs.forEach(drug => {
    if (mergedDrugs.has(drug.drugId)) {
      const existing = mergedDrugs.get(drug.drugId)!;
      existing.products.push(...drug.products);
    } else {
      mergedDrugs.set(drug.drugId, drug);
    }
  });

  drugs = Array.from(mergedDrugs.values());

  log('Drug: Indexing drugs for search');

  const options = {
    isCaseSensitive: false,
    findAllMatches: true,
    shouldSort: true,
    minMatchCharLength: 2,
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    keys: [
      'proprietaryName',
      'proprietaryNameSuffix',
      'nonProprietaryNames',
      'pharmClasses.className',
      'formulae.substances.substanceName',
    ],
  };
  const index = Fuse.createIndex(options.keys, drugs);
  fuse = new Fuse(drugs, options, index);

  log('Drug: Collecting drug classes');

  const caseInsensitive = new Set<string>();
  const classSet = new Set<string>();

  drugs.forEach(drug => {
    drug.pharmClasses.forEach(c => {
      const key = c.className.trim();
      if (!caseInsensitive.has(key.toLowerCase())) {
        classSet.add(key);
        caseInsensitive.add(key.toLowerCase());
      }
    });
  });

  pharmClasses = [...classSet].sort().sort((a, b) => a.length - b.length);

  log(`Drug: Done, ${drugs.length} drugs and ${pharmClasses.length} classes`);
}
