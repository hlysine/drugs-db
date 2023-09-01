import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getDrug } from './api';
import { FullDrugInfo } from '../../drug-types';

export default function DrugDetails(): JSX.Element {
  const params = useParams();

  const [drug, setDrug] = useState<FullDrugInfo>();

  useEffect(() => {
    (async () => {
      if (params.id) setDrug(await getDrug(params.id));
    })();
  }, [params.id]);
  return (
    <div className="p-8 flex flex-col gap-2">
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
        <pre>{JSON.stringify(drug, undefined, 2)}</pre>
      ) : (
        <span className="loading loading-dots loading-lg"></span>
      )}
    </div>
  );
}
