import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SearchResult } from '../../drug-types';
import debounce from 'lodash/debounce';
import { searchDrugs } from './api';
import BasicDrugCard from './BasicDrugCard';

export default function DrugSearch(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
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
    if (searchParams.has('q')) {
      requestId.current++;
      search(searchParams.get('q')!, requestId.current);
    }
  }, [searchParams]);

  useEffect(() => {
    setSearchParams({ q: query }, { replace: true });
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
        autoFocus
        placeholder="Search for drugs"
        className={`input input-bordered w-full max-w-md ${
          loading ? 'animate-pulse' : ''
        }`}
        onChange={e => setQuery(e.target.value)}
      />
      {results ? (
        <div className="flex flex-col gap-2 items-center">
          <div className="text-sm">{results.total} results found</div>
          <div className="flex flex-wrap gap-4 w-full justify-center items-start">
            {results.items.map(result => (
              <BasicDrugCard
                key={result.drugId}
                drug={result}
                onClick={() =>
                  navigate('/drug/' + result.drugId, { state: result })
                }
              />
            ))}
          </div>
        </div>
      ) : loading ? (
        <span className="loading loading-dots loading-lg"></span>
      ) : null}
    </div>
  );
}
