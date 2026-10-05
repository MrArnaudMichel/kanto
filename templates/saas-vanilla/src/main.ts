import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import { applyBrand } from './brand';
import { startRouter } from './router';
import { ROUTES } from './routes';

applyBrand();
startRouter(document.querySelector<HTMLElement>('#app')!, ROUTES);
