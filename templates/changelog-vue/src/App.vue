<script lang="ts">
import type { Kind } from './releases';

/** The filter, kept while the reader reads a release. */
const kept = { kind: 'all' as Kind | 'all' };
</script>

<script setup lang="ts">
import type { KtHeader, KtNewsletter, KtSubscribeDetail } from 'kanto-ds';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { subscribe } from './actions';
import Changes from './Changes.vue';
import { FOOTER, INTRO, NEWSLETTER, POSTS, RELEASES, SITE } from './content';
import {
  filterReleases,
  formatDate,
  KINDS,
  neighbours,
  releaseByVersion,
  type Release,
} from './releases';

const LINKS = [
  { href: '#/', label: 'Releases' },
  { href: 'rss.xml', label: 'RSS' },
];

const releaseHref = (release: Release) => `#/releases/${release.version}`;

// === The version in the address: #/releases/<version> ===

const read = () => {
  const version = /^#\/releases\/(.+)$/.exec(location.hash)?.[1];
  return version ? decodeURIComponent(version) : null;
};
const version = ref(read());
const onHash = () => (version.value = read());
onMounted(() => window.addEventListener('hashchange', onHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));

const release = computed(() =>
  version.value === null ? undefined : releaseByVersion(RELEASES, version.value),
);
const around = computed(() => (release.value ? neighbours(RELEASES, release.value.version) : {}));

watch(
  [version, release],
  () => {
    document.title = release.value
      ? `${release.value.version} — ${SITE.name} changelog`
      : `${SITE.name} changelog`;
    if (version.value !== null) window.scrollTo(0, 0);
  },
  { immediate: true },
);

// === Every release, by kind ===

const kind = ref<Kind | 'all'>(kept.kind);
watch(kind, (value) => (kept.kind = value), { flush: 'sync' });
const releases = computed(() => filterReleases(RELEASES, kind.value));
const count = computed(() => releases.value.reduce((sum, item) => sum + item.changes.length, 0));

// The chosen filter pressed again would leave none: everything, then.
function onKind(event: CustomEvent<{ value: string | null }>): void {
  kind.value = (event.detail.value as Kind | null) ?? 'all';
}

// === The header and the newsletter ===

const header = useTemplateRef<KtHeader>('header');
const newsletter = useTemplateRef<KtNewsletter>('newsletter');

function toNewsletter(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  newsletter.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

function onSubscribe(event: CustomEvent<KtSubscribeDetail>): void {
  event.detail.wait(subscribe(event.detail.email));
}
</script>

<template>
  <kt-header ref="header" sticky>
    <a slot="brand" class="brand" href="#/">{{ `${SITE.name} changelog` }}</a>
    <nav class="nav" aria-label="Changelog">
      <a v-for="link in LINKS" :key="link.href" :href="link.href">{{ link.label }}</a>
    </nav>
    <nav slot="menu" class="menu" aria-label="Menu">
      <a v-for="link in LINKS" :key="link.href" :href="link.href" @click="header?.closeMenu()">
        {{ link.label }}
      </a>
    </nav>
    <kt-button slot="actions" size="small" icon="rss" @click="toNewsletter">Subscribe</kt-button>
  </kt-header>

  <main class="page">
    <div class="content">
      <section v-if="version === null" class="releases-view" aria-labelledby="title">
        <div class="intro">
          <h1 id="title">{{ INTRO.heading }}</h1>
          <p>{{ INTRO.lead }}</p>
        </div>
        <div class="filter-bar">
          <kt-toggle-button-group
            class="kind-filter"
            label="Show"
            :value="kind"
            @kt-change="onKind"
          >
            <kt-toggle-button v-for="option in KINDS" :key="option.value" :value="option.value">
              {{ option.label }}
            </kt-toggle-button>
          </kt-toggle-button-group>
          <span class="shown">{{ `${count} ${count === 1 ? 'change' : 'changes'}` }}</span>
        </div>
        <div class="releases">
          <kt-empty-state
            v-if="releases.length === 0"
            icon="sparkles"
            heading="Nothing of that kind yet"
          >
            <kt-button slot="actions" variant="secondary" @click="kind = 'all'">
              Show everything
            </kt-button>
          </kt-empty-state>
          <kt-timeline v-else>
            <kt-timeline-item
              v-for="item in releases"
              :key="item.version"
              :heading="item.title"
              :time="formatDate(item.date)"
              icon="sparkles"
              variant="primary"
            >
              <div class="release-heading">
                <a class="release-link" :href="releaseHref(item)">{{ item.version }}</a>
              </div>
              <p class="release-summary">{{ item.summary }}</p>
              <Changes :release="item" />
            </kt-timeline-item>
          </kt-timeline>
        </div>
      </section>

      <article v-else-if="release" class="release-page">
        <a class="back" href="#/">All releases</a>
        <div class="release-meta">{{ `${release.version} · ${formatDate(release.date)}` }}</div>
        <h1>{{ release.title }}</h1>
        <p class="release-summary">{{ release.summary }}</p>
        <Changes :release="release" />
        <nav class="neighbours" aria-label="Other releases">
          <a v-if="around.older" class="older" :href="releaseHref(around.older)">
            {{ `Older: ${around.older.version} — ${around.older.title}` }}
          </a>
          <span v-else />
          <a v-if="around.newer" class="newer" :href="releaseHref(around.newer)">
            {{ `Newer: ${around.newer.version} — ${around.newer.title}` }}
          </a>
          <span v-else />
        </nav>
      </article>

      <kt-error-page v-else home-href="#/" />
    </div>

    <kt-newsletter
      id="subscribe"
      ref="newsletter"
      variant="panel"
      layout="inline"
      align="start"
      :heading="NEWSLETTER.heading"
      :lead="NEWSLETTER.lead"
      @kt-subscribe="onSubscribe"
    />
    <kt-post-grid align="start" :headingLevel="2" heading="From the blog" :posts="POSTS" />
  </main>

  <kt-footer variant="simple">
    <a slot="brand" class="brand" href="#/">{{ SITE.name }}</a>
    {{ FOOTER.tagline }}
    <span slot="legal">{{ FOOTER.legal }}</span>
  </kt-footer>
</template>
