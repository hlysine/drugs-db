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
import { getPharmClasses, getSearchLink, searchDrugs, searchWiki } from './api';
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
