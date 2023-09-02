import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SearchResult } from '../../drug-types';
import debounce from 'lodash/debounce';
import { searchDrugs } from './api';
import BasicDrugCard from './BasicDrugCard';
import BadSearchCard from './BadSearchCard';

export default function DrugSearch(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult>();
  const [loading, setLoading] = useState(false);
  const searchState = useRef({
    timer: null as number | null,
    requestId: 0,
  });
  const searchBox = useRef<HTMLInputElement>(null);

  const search = useMemo(
    () =>
      debounce(
        async (query: string) => {
          setLoading(true);
          searchState.current.requestId++;
          if (searchState.current.timer)
            window.clearTimeout(searchState.current.timer);
          searchState.current.timer = window.setTimeout(
            () =>
              setResults(r => ({
                ...(r ?? { total: 0, items: [], limit: 0, skip: 0 }),
                badSearch: true,
              })),
            2000
          );
          const id = searchState.current.requestId;
          try {
            const result = await searchDrugs(query);
            if (id === searchState.current.requestId) {
              setResults(result);
              if (searchState.current.timer)
                window.clearTimeout(searchState.current.timer);
            }
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
    searchBox.current?.select();
  }, []);

  useEffect(() => {
    if (searchParams.has('q') || results) {
      search(searchParams.get('q') ?? '');
    }
  }, [searchParams]);

  useEffect(() => {
    setSearchParams(
      params => {
        query ? params.set('q', query) : params.delete('q');
        return params;
      },
      { replace: true }
    );
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
        ref={searchBox}
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
            {results.badSearch ? (
              <BadSearchCard key="google" query={query} />
            ) : null}
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
      ) : (
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl">FDA Drug Search</h3>
          <ul className="list-disc">
            <li>You can search for drugs by name or class</li>
            <li>This drug list may not be complete</li>
            <li>All drug names follow US conventions</li>
          </ul>
        </div>
      )}
    </div>
  );
}
