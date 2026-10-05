<script setup lang="ts">
import type { KtSubscribeDetail } from 'kanto-ds';
import { useTemplateRef } from 'vue';
import type { KtHeader } from 'kanto-ds';
import { scrollToSection, startTrial, subscribe } from './actions';
import {
  CTA,
  FEATURES,
  FOOTER,
  HERO,
  LOGOS,
  NAV,
  NEWSLETTER,
  PRICING,
  PRODUCT,
  QUESTIONS,
  TESTIMONIALS,
  logoSrc,
} from './content';

const header = useTemplateRef<KtHeader>('header');

function onSubscribe(event: CustomEvent<KtSubscribeDetail>): void {
  event.detail.wait(subscribe(event.detail.email));
}

function talkToSales(): void {
  location.assign(CTA.secondaryHref);
}
</script>

<template>
  <kt-header ref="header" sticky>
    <a slot="brand" class="brand" href="#top">{{ PRODUCT }}</a>
    <nav class="nav">
      <a v-for="link in NAV" :key="link.href" :href="link.href">{{ link.label }}</a>
    </nav>
    <nav slot="menu" class="menu" aria-label="Menu">
      <a v-for="link in NAV" :key="link.href" :href="link.href" @click="header?.closeMenu()">{{
        link.label
      }}</a>
    </nav>
    <kt-button slot="actions" @click="scrollToSection('start')">{{ HERO.primary }}</kt-button>
  </kt-header>
  <main id="top" class="page">
    <kt-hero :heading="HERO.heading" :lead="HERO.lead">
      <a slot="announcement" href="#features">{{ HERO.announcement }}</a>
      <kt-button slot="actions" size="large" @click="scrollToSection(HERO.primaryHref.slice(1))">
        {{ HERO.primary }}
      </kt-button>
      <kt-button
        slot="actions"
        size="large"
        variant="secondary"
        @click="scrollToSection(HERO.secondaryHref.slice(1))"
      >
        {{ HERO.secondary }}
      </kt-button>
      <span slot="note">{{ HERO.note }}</span>
    </kt-hero>
    <kt-logo-cloud :heading="LOGOS.heading">
      <img v-for="name in LOGOS.names" :key="name" :src="logoSrc(name)" :alt="name" />
    </kt-logo-cloud>
    <kt-feature-grid
      id="features"
      :heading="FEATURES.heading"
      :lead="FEATURES.lead"
      :features="FEATURES.items"
    />
    <kt-testimonials
      :heading="TESTIMONIALS.heading"
      :lead="TESTIMONIALS.lead"
      :testimonials="TESTIMONIALS.items"
    />
    <kt-pricing-table
      id="pricing"
      :heading="PRICING.heading"
      :lead="PRICING.lead"
      :yearly-note="PRICING.yearlyNote"
      :plans="PRICING.plans"
    />
    <kt-faq
      id="questions"
      layout="split"
      :heading="QUESTIONS.heading"
      :lead="QUESTIONS.lead"
      :items="QUESTIONS.items"
    >
      <span slot="note">{{ QUESTIONS.note }} <a :href="QUESTIONS.contact">Ask us</a>.</span>
    </kt-faq>
    <kt-cta id="start" :heading="CTA.heading" :lead="CTA.lead">
      <kt-button slot="actions" size="large" @click="startTrial">{{ CTA.primary }}</kt-button>
      <kt-button slot="actions" size="large" variant="secondary" @click="talkToSales">{{
        CTA.secondary
      }}</kt-button>
      <span slot="note">{{ CTA.note }}</span>
    </kt-cta>
    <kt-newsletter
      variant="plain"
      layout="inline"
      align="start"
      :heading="NEWSLETTER.heading"
      :lead="NEWSLETTER.lead"
      @kt-subscribe="onSubscribe"
    >
      <span slot="note">{{ NEWSLETTER.note }}</span>
    </kt-newsletter>
  </main>
  <kt-footer :columns="FOOTER.columns">
    <a slot="brand" class="brand" href="#top">{{ PRODUCT }}</a>
    <span>{{ FOOTER.tagline }}</span>
    <span slot="legal">{{ FOOTER.legal }}</span>
  </kt-footer>
</template>
