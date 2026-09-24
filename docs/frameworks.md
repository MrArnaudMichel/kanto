# Using Kanto with a framework

Kanto is a set of custom elements. They run in any framework, and in none.

```js
import 'kanto-ds'; // registers every element
import 'kanto-ds/styles.css';
```

```html
<kt-button variant="primary" icon="plus">New entity</kt-button>
```

Import a single element instead when you only need a few, so the bundler can
drop the rest:

```js
import 'kanto-ds/components/core/kt-button';
```

## Two rules that apply everywhere

**Data goes in as properties, not attributes.** Anything that is not a string
or a boolean — `options`, `data`, `columns`, `items`, `sections` — is a
property. An attribute can only ever hold a string.

**Events are `kt-`-prefixed CustomEvents**, and the payload is in `detail`.
They bubble and cross shadow boundaries, so you can listen on a container.

---

## Vanilla

```js
const select = document.querySelector('kt-select');
select.options = [{ id: 'ne', label: 'North East' }];
select.addEventListener('kt-change', (e) => console.log(e.detail.value));
```

## React

### React 19

React 19 renders custom elements natively: a prop the element has is set as a
property, so `options={regions}` arrives as an array, and a prop named `on` +
an event name listens for that event. Use the tags directly — no wrapper, no
extra package:

```tsx
import 'kanto-ds';
import 'kanto-ds/styles.css';
import type {} from 'kanto-ds/react/jsx'; // types for the kt-* tags, loads nothing

export function Filters() {
  const [region, setRegion] = useState<string | number | null>(null);

  return (
    <>
      <kt-select options={regions} onkt-change={(e) => setRegion(e.detail.value)} />
      <kt-button variant="primary">Apply</kt-button>
    </>
  );
}
```

Events keep their own name after `on`: `onkt-change` for `kt-change`,
`onkt-files-change` for `kt-files-change`. `kanto-ds/react/jsx` is what lets
TypeScript accept the `kt-*` tags, and it types each one's properties and each
handler's `e.detail`. A plain JavaScript project can skip it.

### React 18

React 18 sets every prop as a string attribute and cannot listen for custom
events, so it needs the wrappers in `kanto-ds/react`. They are built on
`@lit/react`, which Kanto does not install for everyone — **install it
alongside**:

```bash
npm install kanto-ds @lit/react
```

```tsx
import { KtSelect, KtButton } from 'kanto-ds/react';
import 'kanto-ds/styles.css';

<KtSelect options={regions} onKtChange={(e) => setRegion(e.detail.value)} />
<KtButton variant="primary">Apply</KtButton>
```

The wrappers also work on React 19, if you prefer `onKtChange` to
`onkt-change`.

## Vue

Vue 3 renders custom elements natively and sets non-primitive bindings as DOM
properties, so `<kt-select :options="regions">` already does the right thing.
There are no Vue wrappers, deliberately — they would only be one more layer to
keep in sync.

Tell the compiler which tags are custom elements:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { isKantoElement } from 'kanto-ds/vue';

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: isKantoElement } } })],
});
```

```ts
// main.ts
import 'kanto-ds/vue'; // registers the elements and types the templates
import 'kanto-ds/styles.css';
```

```vue
<template>
  <kt-input :value="query" placeholder="Search" @kt-change="query = $event.detail.value" />
  <kt-select :options="regions" @kt-change="region = $event.detail.value" />
</template>
```

There is no `v-model` shim. `v-model` on a custom element expects an
`update:modelValue` event, and making every Kanto element emit a Vue-shaped
event that means nothing outside Vue is the wrong trade — the explicit binding
above is one line and says exactly what it does.

## Angular

Custom elements need no wrapper. Add the schema once:

```ts
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'kanto-ds';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <kt-input placeholder="Search" (kt-change)="onQuery($event)" />
    <kt-select [options]="regions" (kt-change)="onRegion($event)" />
  `,
})
export class FiltersComponent {}
```

## Svelte

Nothing to configure. Svelte sets properties on elements it does not recognise
and listens for any event name:

```svelte
<script>
  import 'kanto-ds';
  let query = '';
</script>

<kt-input placeholder="Search" on:kt-change={(e) => (query = e.detail.value)} />
<kt-select {options} on:kt-change={(e) => (region = e.detail.value)} />
```

## Server-side rendering

The elements need a DOM at definition time. Import them in a client-only entry
point (`onMount`, a dynamic `import()` in an effect, Next's `ssr: false`), and
they will upgrade in place once they load — the markup renders unstyled but
present in the meantime.

The token layer is plain CSS and can be served from the very first byte.
