import type { Template } from './index.js';

export const onboarding: Template = {
  slug: 'onboarding',
  name: 'Onboarding',
  description: 'A three-step set-up: the steps on top, one panel at a time, back and next.',
  html: `<style>
  .onboard {
    display: grid;
    gap: 32px;
    align-content: start;
    max-width: 640px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 48px 24px;
    background: var(--surface-page);
  }
  .onboard h1 {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h4);
  }
  .onboard-panel {
    display: grid;
    gap: 16px;
    padding: 24px;
    background: var(--surface-card);
    border: var(--border-width) solid var(--border-subtle);
    border-radius: var(--radius-modal);
  }
  .onboard-panel[hidden] {
    display: none;
  }
  .onboard-panel h2 {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h6);
  }
  .onboard-nav {
    display: flex;
    justify-content: space-between;
  }
</style>

<main class="onboard">
  <h1>Set up your workspace</h1>
  <kt-steps id="steps" label="Set-up" current="workspace" navigable></kt-steps>

  <section class="onboard-panel" data-step="workspace">
    <h2>Your workspace</h2>
    <kt-label-input label="Workspace name">
      <kt-input value="Northwind" name="workspace"></kt-input>
    </kt-label-input>
    <kt-label-input label="Team size">
      <kt-number-input name="size" min="1" max="500" value="12"></kt-number-input>
    </kt-label-input>
  </section>

  <section class="onboard-panel" data-step="data" hidden>
    <h2>Bring your data</h2>
    <kt-drag-drop accept=".csv,.xlsx" name="spreadsheet"></kt-drag-drop>
    <kt-checkbox checked>Detect the columns for me</kt-checkbox>
  </section>

  <section class="onboard-panel" data-step="team" hidden>
    <h2>Invite your team</h2>
    <kt-label-input label="Emails, one per line">
      <kt-textarea rows="4" placeholder="alex@northwind.io"></kt-textarea>
    </kt-label-input>
  </section>

  <nav class="onboard-nav">
    <kt-button variant="secondary" id="back" disabled>Back</kt-button>
    <kt-button variant="primary" id="next">Next</kt-button>
  </nav>
</main>`,
  script: `import { toaster } from 'kanto-ds';

const STEPS = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'data', label: 'Your data', description: 'Optional' },
  { id: 'team', label: 'Your team' },
];
const steps = document.querySelector('#steps');
steps.steps = STEPS;

function show(id) {
  steps.current = id;
  const index = STEPS.findIndex((step) => step.id === id);
  for (const panel of document.querySelectorAll('[data-step]')) {
    panel.hidden = panel.dataset.step !== id;
  }
  document.querySelector('#back').disabled = index === 0;
  document.querySelector('#next').textContent = index === STEPS.length - 1 ? 'Finish' : 'Next';
}

steps.addEventListener('kt-change', (event) => show(event.detail.id));
document.querySelector('#back').addEventListener('click', () => {
  const index = STEPS.findIndex((step) => step.id === steps.current);
  show(STEPS[index - 1].id);
});
document.querySelector('#next').addEventListener('click', () => {
  const index = STEPS.findIndex((step) => step.id === steps.current);
  if (index === STEPS.length - 1) toaster.success('Your workspace is ready');
  else show(STEPS[index + 1].id);
});`,
};
