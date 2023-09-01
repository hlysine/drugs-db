import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import PillSvg from './pill.svg';

const links = [
  {
    icon: <img src={PillSvg} />,
    title: 'Drugs Search',
    description: 'From the FDA drugs database',
    link: '/drug',
  },
];

export default function App() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-8 w-full items-center p-8">
      <Helmet>
        <title>Food and Drug Database</title>
      </Helmet>
      <div className="text-sm breadcrumbs flex justify-center w-full">
        <ul>
          <li>
            <a href="https://lysine-med.hf.space/">Med</a>
          </li>
          <li>Food &amp; Drug</li>
        </ul>
      </div>
      <p className="text-3xl text-center">Food and Drug Database</p>
      <p>Quick access to food and drug data from the FDA database.</p>
      <div className="flex flex-col gap-8 items-stretch">
        {links.map(link => (
          <div
            key={link.title}
            className="card sm:card-side bg-base-300 shadow-xl w-full sm:min-w-[500px]"
          >
            <figure className="bg-accent p-4">{link.icon}</figure>
            <div className="card-body">
              <h2 className="card-title">{link.title}</h2>
              <p>{link.description}</p>
              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    link.link.startsWith('http')
                      ? (window.location.href = link.link)
                      : navigate(link.link)
                  }
                >
                  Enter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
