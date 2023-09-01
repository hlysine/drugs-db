import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getDrug } from './api';
import { FullDrugInfo, nameProductType } from '../../drug-types';

function getBannerByType(drug: FullDrugInfo) {
  switch (drug.productTypeName) {
    case 'HUMAN OTC DRUG':
      return (
        <div
          className={`border-b-2 w-full flex justify-end flex-wrap items-center gap-4 border-primary`}
        >
          <div className="text-sm opacity-60 overflow-hidden whitespace-nowrap text-ellipsis flex-1">
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
          <div className="text-sm opacity-60 overflow-hidden whitespace-nowrap text-ellipsis flex-1">
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
          <div className="text-sm opacity-60 overflow-hidden whitespace-nowrap text-ellipsis flex-1">
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

  const [drug, setDrug] = useState<FullDrugInfo>();

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
        <div
          className={`flex flex-col gap-4 w-full max-w-6xl pt-4 rounded-t-lg ${
            drug.drugFinished ? '' : 'cross-out'
          }`}
        >
          <h1 className="text-4xl lg:text-6xl">
            {drug.proprietaryName}{' '}
            <span className="opacity-60 text-3xl lg:text-5xl">
              {drug.proprietaryNameSuffix}
            </span>
          </h1>
          <div className="text-2xl text-accent">
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
      ) : (
        <span className="loading loading-dots loading-lg"></span>
      )}
    </div>
  );
}
