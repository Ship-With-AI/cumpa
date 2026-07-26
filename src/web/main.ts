import { createApp } from 'vue';

import App from './App.vue';

const prototype = new URLSearchParams(window.location.search).get('prototype');
const RootComponent = import.meta.env.DEV && prototype === 'phase6'
  // DEV-only prototype stays out of the normal application path and loads only for the explicit share URL.
  ? (await import('./prototypes/Phase6DiffSemanticsPrototype.vue')).default
  : App;

createApp(RootComponent).mount('#app');
