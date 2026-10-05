<script setup lang="ts">
import type { KtHeader } from 'kanto-ds';
import { computed, ref, useTemplateRef } from 'vue';
import { downloadCv, scrollToSection } from './actions';
import CaseStudy from './CaseStudy.vue';
import ContactForm from './ContactForm.vue';
import { CAREER, CONTACT, FOOTER, NAV, NUMBERS, PERSON, POSTS, TAGS } from './content';
import Timeline from './Timeline.vue';
import { projectsTagged } from './work';

const header = useTemplateRef<KtHeader>('header');
const tag = ref('All');
const open = ref<string | null>(null);
const projects = computed(() => projectsTagged(tag.value));

function onFilter(event: CustomEvent<{ value: string | string[] | null }>): void {
  const value = event.detail.value as string | null;
  // The chosen tag clicked again empties the group: keep a tag chosen — All.
  if (value === null) (event.target as HTMLElement & { value: string | null }).value = 'All';
  tag.value = value ?? 'All';
}
</script>

<template>
  <kt-header ref="header" sticky>
    <a slot="brand" class="brand" href="#top">{{ PERSON.name }}</a>
    <nav class="nav">
      <a v-for="link in NAV" :key="link.href" :href="link.href">{{ link.label }}</a>
    </nav>
    <nav slot="menu" class="menu" aria-label="Menu">
      <a v-for="link in NAV" :key="link.href" :href="link.href" @click="header?.closeMenu()">{{
        link.label
      }}</a>
    </nav>
    <kt-button slot="actions" icon="mail" @click="scrollToSection('contact')"
      >Get in touch</kt-button
    >
  </kt-header>

  <main id="top" class="page">
    <section class="intro">
      <kt-avatar :name="PERSON.name" size="large" />
      <div>
        <kt-badge :label="PERSON.available" variant="category" />
        <h1>{{ PERSON.heading }}</h1>
        <p>{{ PERSON.lead }}</p>
        <div class="row">
          <kt-button icon="arrow-down" @click="scrollToSection('work')">See the work</kt-button>
          <kt-button variant="secondary" icon="download" @click="downloadCv">Download CV</kt-button>
        </div>
      </div>
    </section>

    <section class="numbers" aria-label="In numbers">
      <kt-stat
        v-for="number in NUMBERS"
        :key="number.label"
        :label="number.label"
        :value="number.value"
        :icon="number.icon"
      />
    </section>

    <section id="work">
      <div class="section-head">
        <h2>Selected work</h2>
        <kt-toggle-button-group
          class="work-filter"
          label="Filter by tag"
          :value="tag"
          @kt-change="onFilter"
        >
          <kt-toggle-button v-for="name in TAGS" :key="name" :value="name">{{
            name
          }}</kt-toggle-button>
        </kt-toggle-button-group>
      </div>
      <div class="work-grid">
        <kt-empty-state
          v-if="projects.length === 0"
          heading="Nothing tagged that yet"
          icon="search"
        >
          <kt-button slot="actions" @click="tag = 'All'">Show everything</kt-button>
        </kt-empty-state>
        <kt-card
          v-for="project in projects"
          v-else
          :key="project.slug"
          class="work-card"
          clickable
          @kt-card-click="open = project.slug"
        >
          <h3>{{ project.name }}</h3>
          <p>{{ project.tagline }}</p>
          <div class="tags">
            <kt-badge v-for="name in project.tags" :key="name" :label="name" />
          </div>
          <span slot="footer">Read the case study</span>
        </kt-card>
      </div>
    </section>

    <section id="career">
      <div class="section-head"><h2>Where I have been</h2></div>
      <Timeline :steps="CAREER" />
    </section>

    <section id="writing">
      <div class="section-head"><h2>Writing</h2></div>
      <kt-post-grid layout="list" align="start" :heading-level="2" :posts="POSTS" />
    </section>

    <section id="contact" class="contact">
      <h2>{{ CONTACT.heading }}</h2>
      <p>{{ CONTACT.lead }}</p>
      <ContactForm />
    </section>
  </main>

  <CaseStudy :slug="open" @close="open = null" />

  <kt-footer variant="simple">
    <a slot="brand" class="brand" href="#top">{{ PERSON.name }}</a>
    {{ FOOTER.tagline }}
    <span slot="legal">{{ FOOTER.legal }}</span>
  </kt-footer>
</template>
