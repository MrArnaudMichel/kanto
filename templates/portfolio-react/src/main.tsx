import 'kanto-ds';
import 'kanto-ds/styles.css';
import type {} from 'kanto-ds/react/jsx';
import './styles.css';
import './icons';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyBrand } from './brand';

applyBrand();
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
