import 'kanto-ds/vue';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import { createApp } from 'vue';
import App from './App.vue';
import { applyBrand } from './brand';

applyBrand();
createApp(App).mount('#app');
