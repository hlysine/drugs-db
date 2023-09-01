import React from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import App from './App';
import DrugSearch from './drug/DrugSearch';
import DrugDetails from './drug/DrugDetails';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/drug',
    element: <DrugSearch />,
  },
  {
    path: '/drug/:id',
    element: <DrugDetails />,
  },
]);

const container = document.querySelector('#root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
