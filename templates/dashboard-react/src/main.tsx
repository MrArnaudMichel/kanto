import 'kanto-ds';
import 'kanto-ds/styles.css';
import type {} from 'kanto-ds/react/jsx';
import './styles.css';
import './icons';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { applyBrand } from './brand';
import { router } from './router';

applyBrand();
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
