import React, {
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SearchResult, WikiPage } from '../../drug-types';
import debounce from 'lodash/debounce';
import {
  getPharmClasses,
  getSearchLink,
  getWikiLink,
  searchDrugs,
  searchWiki,
} from './api';
import BasicDrugCard from './BasicDrugCard';
import BadSearchCard from './BadSearchCard';
import isEmpty from 'lodash/isEmpty';
import Highlighter from 'react-highlight-words';
import approxSearch from 'approx-string-match';
import minBy from 'lodash/minBy';

const textHighlighter = (text: string, words: string[]) => {
  text = text.toLowerCase();
  return words.flatMap(word =>
    approxSearch(
      text,
      word.toLowerCase(),
      Math.max(1, Math.floor(word.length / 10))
    ).map(mark => ({
      start: text[mark.start] === ' ' ? mark.start + 1 : mark.start,
      end: text[mark.end - 1] === ' ' ? mark.end - 1 : mark.end,
    }))
  );
};

const Highlighted = ({ children }: PropsWithChildren) => (
  <span className="underline underline-offset-2 font-semibold">{children}</span>
);

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
  const [wiki, setWiki] = useState<WikiPage | null>();
  const [showWiki, setShowWiki] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchState = useRef({
    requestId: 0,
    wikiId: 0,
  });
  const searchBox = useRef<HTMLInputElement>(null);
  const [pharmClasses, setPharmClasses] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setPharmClasses(
        (await getPharmClasses())
          // discard short classes to avoid false positives
          .filter(c => c.length >= 5)
          // split long words into separate classes because these long words are likely specific
          .flatMap(c =>
            c.includes(' ')
              ? [c, ...c.split(' ').filter(s => s.length > 20)]
              : [c]
          )
          // require standalone words for short classes
          .flatMap(c => (c.length <= 6 ? [` ${c} `, ` ${c},`, ` ${c}.`] : [c]))
      );
    })();
  }, []);

  const search = async (query: string, limit: number, skip: number) => {
    setLoading(true);
    setShowWiki(false);
    searchState.current.requestId++;
    searchState.current.wikiId++;
    const id = searchState.current.requestId;
    const wikiId = searchState.current.wikiId;
    let result: SearchResult | undefined = undefined;
    try {
      await Promise.all([
        (async () => {
          result = await searchDrugs(query, limit, skip);
          if (id === searchState.current.requestId) {
            setResults(result);
            if (result.items.length > 0 && !result.badSearch) {
              // Pick a term to be searched in wiki that matches the search query the best
              const choice = minBy(
                [
                  result.items[0]?.proprietaryName,
                  result.items[0]?.nonProprietaryNames.join(', '),
                  ...(result.items[0]?.pharmClasses.map(c => c.className) ??
                    []),
                ]
                  .filter(s => !isEmpty(s))
                  .map(s => ({
                    term: s!,
                    error: approxSearch(
                      s!.toLowerCase(),
                      query.toLowerCase(),
                      Math.max(1, Math.floor(query.length / 10))
                    ).reduce(
                      (min, curr) => Math.min(min, curr.errors),
                      Number.POSITIVE_INFINITY
                    ),
                  })),
                'error'
              );
              if (choice && choice.error < choice.term.length / 2) {
                searchState.current.wikiId++;
                const wikiId = searchState.current.wikiId;
                const wikiResult = await searchWiki(choice.term);
                if (wikiId === searchState.current.wikiId && wikiResult) {
                  setWiki(wikiResult);
                }
              }
            }
          }
        })(),
        (async () => {
          const wikiResult = await searchWiki(query);
          if (wikiId === searchState.current.wikiId) {
            setWiki(wikiResult);
          }
        })(),
      ]);
    } finally {
      setLoading(false);
      const finalResult = result as any as SearchResult;
      if (finalResult.badSearch || finalResult.total === 0) {
        setShowWiki(true);
      }
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

  const highlights = useMemo(() => {
    const text = wiki?.extract ?? '';
    if (isEmpty(text)) return [];
    return textHighlighter(text, pharmClasses);
  }, [wiki?.extract, pharmClasses]);

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
      <div className="flex gap-4 items-center w-full max-w-md">
        <input
          ref={searchBox}
          type="text"
          value={query}
          autoFocus
          placeholder="Search for drugs"
          className={`input input-bordered flex-1 min-w-0 ${
            loading ? 'animate-pulse' : ''
          }`}
          onChange={e => {
            setQuery(e.target.value);
            setLimit(20);
            setSkip(0);
          }}
        />
        <button
          className="btn btn-circle"
          onClick={() =>
            !isEmpty(query) && window.open(getSearchLink(query), '_blank')
          }
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-base-content opacity-70 w-8 h-8"
          >
            <path d="m12 10.282h11.328c.116.6.184 1.291.187 1.997v.003c.001.066.002.144.002.222 0 2.131-.527 4.139-1.457 5.901l.033-.069c-.941 1.762-2.324 3.18-4.004 4.137l-.051.027c-1.675.945-3.677 1.502-5.809 1.502-.081 0-.162-.001-.242-.002h.012c-.013 0-.029 0-.044 0-1.672 0-3.263-.348-4.704-.975l.076.03c-2.902-1.219-5.164-3.482-6.354-6.306l-.029-.077c-.598-1.379-.945-2.985-.945-4.672s.348-3.293.975-4.75l-.03.078c1.219-2.902 3.482-5.164 6.306-6.354l.077-.029c1.364-.597 2.953-.944 4.624-.944h.051-.003c.059-.001.129-.002.199-.002 3.045 0 5.811 1.197 7.853 3.147l-.004-.004-3.266 3.141c-1.188-1.152-2.81-1.863-4.598-1.863-.065 0-.129.001-.194.003h.009c-.014 0-.03 0-.047 0-1.358 0-2.629.378-3.711 1.034l.032-.018c-2.246 1.358-3.725 3.788-3.725 6.562s1.479 5.204 3.691 6.543l.034.019c1.051.638 2.321 1.016 3.679 1.016h.05-.003.083c.864 0 1.695-.137 2.474-.392l-.056.016c.716-.222 1.339-.542 1.893-.95l-.017.012c.486-.373.907-.794 1.268-1.264l.012-.016c.312-.393.582-.841.79-1.321l.015-.039c.149-.35.271-.759.346-1.184l.005-.035h-6.811z" />
          </svg>
        </button>
        <button
          className="btn btn-circle"
          onClick={() =>
            !isEmpty(query) && window.open(getWikiLink(query), '_blank')
          }
        >
          <svg
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-base-content opacity-70 w-8 h-8"
          >
            <g id="g2036" transform="translate(0.999998,0)">
              <path
                id="V1"
                d="M 95.868706,23.909104 L 95.868706,26.048056 C 93.047361,26.549147 90.911826,27.435559 89.462097,28.707293 C 87.385251,30.595808 84.936539,33.486281 83.330062,37.378719 L 50.644589,104.09089 L 48.469874,104.09089 L 15.65694,36.511576 C 14.128742,33.043075 12.051176,30.923395 11.424244,30.152531 C 10.44463,28.957874 9.2397119,28.023288 7.8095029,27.34877 C 6.3792686,26.674401 4.449448,26.24083 2.0200347,26.048056 L 2.0200347,23.909104 L 33.947916,23.909104 L 33.947916,26.048056 C 30.264562,26.394989 28.508523,27.011623 27.411399,27.89796 C 26.314212,28.784446 25.765634,29.921365 25.76566,31.308721 C 25.765634,33.235773 26.666868,36.241865 28.469368,40.327004 L 52.701762,86.285559 L 76.394453,40.905099 C 78.236045,36.434562 79.763939,33.332122 79.764002,31.597768 C 79.763939,30.48019 79.195764,29.410715 78.059498,28.389341 C 76.92308,27.368114 75.637251,26.645496 72.933606,26.221484 C 72.737621,26.183021 72.404568,26.125211 71.934408,26.048056 L 71.934408,23.909104 L 95.868706,23.909104 z "
              />
              <path
                id="V2"
                d="M 123.97997,23.909104 L 123.97997,26.048056 C 121.15863,26.549147 119.0231,27.435559 117.57337,28.707293 C 115.49652,30.595808 113.04781,33.486281 111.44133,37.378719 L 82.755857,104.09089 L 80.581143,104.09089 L 50.268209,36.511576 C 48.74001,33.043075 46.662445,30.923395 46.035513,30.152531 C 45.055898,28.957874 43.850981,28.023288 42.420772,27.34877 C 40.990537,26.674401 39.694911,26.24083 37.265497,26.048056 L 37.265497,23.909104 L 68.559185,23.909104 L 68.559185,26.048056 C 64.875831,26.394989 63.119792,27.011623 62.022668,27.89796 C 60.925481,28.784446 60.376903,29.921365 60.376928,31.308721 C 60.376903,33.235773 61.278137,36.241865 63.080637,40.327004 L 84.813031,86.285559 L 104.50572,40.905099 C 106.34731,36.434562 107.87521,33.332122 107.87527,31.597768 C 107.87521,30.48019 107.30703,29.410715 106.17077,28.389341 C 105.03435,27.368114 103.11433,26.645496 100.41068,26.221484 C 100.2147,26.183021 99.88164,26.125211 99.41148,26.048056 L 99.41148,23.909104 L 123.97997,23.909104 z "
              />
            </g>
          </svg>
        </button>
      </div>
      {loading || results ? (
        <div className="collapse collapse-arrow bg-transparent">
          <input
            type="checkbox"
            checked={showWiki}
            onChange={e => setShowWiki(e.target.checked)}
            className="peer"
          />
          <div className="collapse-title min-h-16 bg-transparent text-base-content border-0 opacity-70 h-10 text-ellipsis overflow-hidden peer-checked:border-y peer-checked:opacity-100 peer-checked:h-max transition-all">
            <Highlighter
              searchWords={pharmClasses}
              textToHighlight={wiki?.extract ?? ''}
              findChunks={() => highlights}
              highlightTag={Highlighted}
            />
          </div>
        </div>
      ) : null}
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
