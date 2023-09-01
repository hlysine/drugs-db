import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SearchResult } from '../../drug-types';
import debounce from 'lodash/debounce';
import { searchDrugs } from './api';
import BasicDrugCard from './BasicDrugCard';

export default function DrugSearch(): JSX.Element {
  const [query, setQuery] = useState('ZYPREXA'); // TODO: DEBUG
  const [results, setResults] = useState<SearchResult>();
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const search = useMemo(
    () =>
      debounce(
        async (query: string, id: number) => {
          setLoading(true);
          try {
            const result = await searchDrugs(query);
            if (id === requestId.current) setResults(result);
          } finally {
            setLoading(false);
          }
        },
        300,
        { leading: false, trailing: true }
      ),
    []
  );

  useEffect(() => {
    if (query) {
      requestId.current++;
      search(query, requestId.current);
    }
  }, [query]);

  return (
    <div className="p-8 flex flex-col gap-8 w-full items-center">
      <Helmet>
        <title>Drug Search - drugs-db</title>
      </Helmet>
      <div className="text-sm breadcrumbs flex justify-center w-full">
        <ul>
          <li>
            <a href="https://lysine-med.hf.space/">Med</a>
          </li>
          <li>
            <Link to="/">Food &amp; Drug</Link>
          </li>
          <li>Drug</li>
        </ul>
      </div>
      <input
        type="text"
        value={query}
        placeholder="Search for drugs"
        className={`input input-bordered w-full max-w-md ${
          loading ? 'animate-pulse' : ''
        }`}
        onChange={e => setQuery(e.target.value)}
      />
      {results && (
        <div className="flex flex-wrap gap-4 w-full justify-center items-center">
          {results.items.map(result => (
            <BasicDrugCard key={result.drugId} drug={result} />
          ))}
        </div>
      )}
    </div>
  );
}
