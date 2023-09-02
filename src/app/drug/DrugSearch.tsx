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
  const [limit, setLimit] = useState(
    parseInt(searchParams.get('limit') ?? '20', 10)
  );
  const [skip, setSkip] = useState(
    parseInt(searchParams.get('skip') ?? '0', 10)
  );
  const [results, setResults] = useState<SearchResult>();
  const [loading, setLoading] = useState(false);
  const searchState = useRef({
    timer: null as number | null,
    requestId: 0,
  });
  const searchBox = useRef<HTMLInputElement>(null);

  const search = async (query: string, limit: number, skip: number) => {
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
      const result = await searchDrugs(query, limit, skip);
      if (id === searchState.current.requestId) {
        setResults(result);
        if (searchState.current.timer)
          window.clearTimeout(searchState.current.timer);
      }
    } finally {
      setLoading(false);
    }
  };

  const setParams = useMemo(
    () =>
      debounce(
        async (query: string, limit: number, skip: number) => {
          setSearchParams(
            params => {
              query ? params.set('q', query) : params.delete('q');
              limit !== 20
                ? params.set('limit', limit.toString())
                : params.delete('limit');
              skip !== 0
                ? params.set('skip', skip.toString())
                : params.delete('skip');
              return params;
            },
            { replace: true }
          );
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
    if ((searchParams.has('q') || results) && limit > 0) {
      search(
        searchParams.get('q') ?? '',
        parseInt(searchParams.get('limit') ?? '20', 10),
        parseInt(searchParams.get('skip') ?? '0', 10)
      );
    }
  }, [searchParams]);

  useEffect(() => {
    setParams(query, limit, skip);
  }, [query, limit, skip]);

  return (
    <div className="flex flex-col gap-8 w-full items-center p-3 md:p-8">
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
        onChange={e => {
          setQuery(e.target.value);
          setLimit(20);
          setSkip(0);
        }}
      />
      {results ? (
        <div className="flex flex-col gap-4 items-center w-full">
          <div className="flex flex-col gap-2 items-center w-full">
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
          {results.total > 0 ? (
            <div className="join">
              <button
                className="join-item btn"
                onClick={() => {
                  setSkip(s => Math.max(s - limit, 0));
                }}
              >
                «
              </button>
              <div className="join-item btn" onClick={() => setSkip(0)}>
                Page {Math.floor(skip / limit) + 1} /{' '}
                {Math.ceil(results.total / limit)}
              </div>
              <button
                className="join-item btn"
                onClick={() => {
                  setSkip(s =>
                    Math.min(
                      s + limit,
                      Math.floor(results.total / limit) * limit
                    )
                  );
                }}
              >
                »
              </button>
            </div>
          ) : null}
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
