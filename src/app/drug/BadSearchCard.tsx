import React from 'react';

export interface BadSearchCardProps {
  query: string;
}

export default function BadSearchCard({ query }: BadSearchCardProps) {
  return (
    <div className="card card-compact w-96 shadow-md rounded-md overflow-hidden">
      <div className="card-body">
        <h2 className="card-title">No good matches...</h2>
        <p>Do you want to search for "{query}" on Google?</p>
        <div className="card-actions justify-end">
          <a
            className="btn btn-primary"
            target="_blank"
            href={`https://google.com/search?q=${encodeURIComponent(query)}`}
          >
            Search
          </a>
        </div>
      </div>
    </div>
  );
}
