import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getDrug, getSearchLink } from './api';
import {
  BasicDrugInfo,
  FullDrugInfo,
  getBadgeByType,
  getNameByType,
  nameMarketingCategory,
  nameProductType,
} from '../../drug-types';

function getBannerByType(drug: BasicDrugInfo) {
  switch (drug.productTypeName) {
    case 'HUMAN OTC DRUG':
      return (
        <div
          className={`border-b-2 w-full flex justify-end flex-wrap items-center gap-4 border-primary`}
        >
          <div className="text-sm opacity-60 overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-[50%]">
            {drug.labelerName}
          </div>
          {drug.deaSchedule ? (
            <div className="badge">DEA Schedule {drug.deaSchedule}</div>
          ) : null}
          {drug.drugFinished ? null : (
            <div className="badge badge-ghost">UNFINISHED DRUG</div>
          )}
          <div className={`py-2 px-4 mx-4 bg-primary text-primary-content`}>
            {nameProductType(drug.productTypeName)}
          </div>
        </div>
      );
    case 'HUMAN PRESCRIPTION DRUG':
      return (
        <div
          className={`border-b-2 w-full flex justify-end flex-wrap items-center gap-4 border-secondary`}
        >
          <div className="text-sm opacity-60 overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-[50%]">
            {drug.labelerName}
          </div>
          {drug.deaSchedule ? (
            <div className="badge">DEA Schedule {drug.deaSchedule}</div>
          ) : null}
          {drug.drugFinished ? null : (
            <div className="badge badge-ghost">UNFINISHED DRUG</div>
          )}
          <div className={`py-2 px-4 mx-4 bg-secondary text-secondary-content`}>
            {nameProductType(drug.productTypeName)}
          </div>
        </div>
      );
    default:
      return (
        <div
          className={`border-b-2 w-full flex justify-end flex-wrap items-center gap-4 border-accent`}
        >
          <div className="text-sm opacity-60 overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-[50%]">
            {drug.labelerName}
          </div>
          {drug.deaSchedule ? (
            <div className="badge">DEA Schedule {drug.deaSchedule}</div>
          ) : null}
          {drug.drugFinished ? null : (
            <div className="badge badge-ghost">UNFINISHED DRUG</div>
          )}
          <div className={`py-2 px-4 mx-4 bg-accent text-accent-content`}>
            {nameProductType(drug.productTypeName)}
          </div>
        </div>
      );
  }
}

export default function DrugDetails(): JSX.Element {
  const params = useParams();
  const location = useLocation();

  const [drug, setDrug] = useState<FullDrugInfo | BasicDrugInfo>(
    location.state ?? undefined
  );

  useEffect(() => {
    (async () => {
      if (params.id) setDrug(await getDrug(params.id));
    })();
  }, [params.id]);
  return (
    <div className="p-8 flex flex-col gap-2 items-center">
      <Helmet>
        <title>Drug Info - drugs-db</title>
      </Helmet>
      <div className="text-sm breadcrumbs flex justify-center w-full">
        <ul>
          <li>
            <a href="https://lysine-med.hf.space/">Med</a>
          </li>
          <li>
            <Link to="/">Food &amp; Drug</Link>
          </li>
          <li>
            <Link to="/drug">Drug</Link>
          </li>
          <li>Details</li>
        </ul>
      </div>
      {drug ? (
        <div className="flex flex-col gap-4 w-full max-w-5xl">
          <div
            className={`flex flex-col gap-4 pt-4 rounded-t-lg ${
              drug.drugFinished ? '' : 'cross-out'
            }`}
          >
            <h1
              className="text-4xl lg:text-6xl hover:scale-105 origin-left transition-transform cursor-pointer"
              onClick={() =>
                window.open(
                  getSearchLink(drug.proprietaryName + ' drug'),
                  '_blank'
                )
              }
            >
              {drug.proprietaryName}{' '}
              <span className="opacity-60 text-3xl lg:text-5xl">
                {drug.proprietaryNameSuffix}
              </span>
            </h1>
            <div
              className="text-2xl text-accent hover:scale-105 origin-left transition-transform cursor-pointer"
              onClick={() =>
                window.open(
                  getSearchLink(drug.proprietaryName + ' drug'),
                  '_blank'
                )
              }
            >
              {drug.nonProprietaryNames.join(', ')}
            </div>
            <div className="first-letter:uppercase lowercase">
              <span className="text-accent-content">
                {drug.routes.join('/')}{' '}
              </span>
              {drug.dosageForms.join(', ')}
            </div>
            {getBannerByType(drug)}
          </div>
          <div className="flex flex-col gap-4">
            {drug.pharmClasses
              .sort((a, b) =>
                a.classType === 'EPC' ? -1 : b.classType === 'EPC' ? 1 : 0
              )
              .map(pharmClass => (
                <div
                  className="flex flex-wrap flex-col sm:flex-row gap-2 md:items-center hover:scale-105 origin-left transition-transform cursor-pointer"
                  key={pharmClass.className + pharmClass.classType}
                  onClick={() =>
                    window.open(getSearchLink(pharmClass.className), '_blank')
                  }
                >
                  <div
                    className={`badge ${getBadgeByType(pharmClass.classType)}`}
                  >
                    {getNameByType(pharmClass.classType, true)}
                  </div>
                  <div>{pharmClass.className}</div>
                </div>
              ))}
          </div>
          <div className="divider !mb-0">Available Products</div>
          {'products' in drug ? (
            drug.products.map(product => (
              <div
                key={product.productNdc}
                className="card bg-neutral text-neutral-content rounded-md overflow-hidden"
              >
                <div className="flex flex-col">
                  <div className="flex items-center flex-wrap gap-4 p-4">
                    <span className="flex-1 opacity-60">
                      {new Date(
                        product.startMarketingDate
                      ).toLocaleDateString()}{' '}
                      -{' '}
                      {product.endMarketingDate
                        ? new Date(
                            product.endMarketingDate
                          ).toLocaleDateString()
                        : ''}
                    </span>
                    <span className="opacity-60">
                      {nameMarketingCategory(product.marketingCategoryName)}
                    </span>
                  </div>
                  <div className="p-4 pt-0 flex flex-col items-center w-full">
                    {product.substances.map(substance => (
                      <div
                        key={substance.substanceName}
                        className="flex flex-wrap gap-2 items-center border-b-2 border-neutral-focus mb-1 w-full max-w-3xl"
                      >
                        <span
                          className="flex-1 hover:scale-105 origin-left transition-transform cursor-pointer"
                          onClick={() => {
                            if (substance.substanceName) {
                              window.open(
                                getSearchLink(substance.substanceName),
                                '_blank'
                              );
                            }
                          }}
                        >
                          {substance.substanceName}
                        </span>
                        <span className="font-bold text-lg">
                          {substance.activeNumeratorStrength}
                        </span>
                        <span className="opacity-60">
                          {substance.activeIngredUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-neutral-focus p-4">
                    {product.packages.map(pkg => (
                      <div key={pkg.ndcPackageCode} className="mb-2">
                        {pkg.packageDescription.map((desc, idx) => (
                          <div key={desc} style={{ marginLeft: idx * 20 }}>
                            {desc}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <span className="loading loading-dots loading-lg"></span>
          )}
        </div>
      ) : (
        <span className="loading loading-dots loading-lg"></span>
      )}
    </div>
  );
}
