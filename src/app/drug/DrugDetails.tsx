import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export default function DrugDetails(): JSX.Element {
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
    </div>
  );
}
