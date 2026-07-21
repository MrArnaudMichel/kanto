import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';

const REGIONS = [
  { id: 'ne', label: 'North East' },
  { id: 'sw', label: 'South West' },
  { id: 'mid', label: 'Midlands' },
  { id: 'nw', label: 'North West' },
];

const PLANS = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

/**
 * A real form, so the page is also a test: every Kanto field is
 * form-associated, and this submit reads the values straight out of FormData
 * with no manual wiring.
 */
function onSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  const entries = [...data.entries()].map(
    ([key, value]) => `${key} = ${value instanceof File ? value.name : value}`,
  );

  toaster.success('Entity created', {
    description: entries.length > 0 ? entries.join(' · ') : 'No fields filled in.',
  });
}

export function formPage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Form</h1>
      <p>
        Every Kanto field is a form-associated custom element: it serialises into
        <code>FormData</code> under its <code>name</code>, resets with the form, and reports its
        validity like a native input. Submit to see exactly what the server would receive.
      </p>
    </header>

    <form @submit=${onSubmit} @reset=${() => toaster.info('Form reset')}>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start">
        <kt-card>
          <h6 slot="header">Identity</h6>
          <div class="stack" style="gap:var(--gap-form)">
            <kt-label-input label="Company name" required>
              <kt-input name="company" required value="Kanto Studio"></kt-input>
            </kt-label-input>

            <kt-label-input label="Email address" required>
              <kt-input
                name="email"
                type="email"
                required
                placeholder="hello@example.com"
              ></kt-input>
            </kt-label-input>

            <kt-label-input label="Phone">
              <kt-input name="phone" type="tel"></kt-input>
            </kt-label-input>

            <kt-label-input label="Region">
              <kt-select name="region" .options=${REGIONS} placeholder="Select"></kt-select>
            </kt-label-input>
          </div>
        </kt-card>

        <kt-card>
          <h6 slot="header">Subscription</h6>
          <div class="stack" style="gap:var(--gap-form)">
            <kt-label-input label="Plan">
              <kt-segmented-control
                label="Plan"
                .value=${'pro'}
                .options=${PLANS}
              ></kt-segmented-control>
            </kt-label-input>

            <kt-label-input label="Internal notes">
              <kt-textarea name="notes" maxlength="280" rows="4"></kt-textarea>
            </kt-label-input>

            <kt-toggle name="newsletter" value="yes" checked>Receive product news</kt-toggle>
            <kt-toggle name="beta" value="yes">Access to beta features</kt-toggle>

            <kt-label-input label="Logo">
              <kt-drag-drop accept="image/*" recommended-size="512×512px"></kt-drag-drop>
            </kt-label-input>
          </div>
        </kt-card>
      </div>

      <div class="row" style="justify-content:flex-end;margin-top:20px">
        <kt-button variant="dark" type="reset">Reset</kt-button>
        <kt-button type="submit" icon="check">Create entity</kt-button>
      </div>
    </form>
  `;
}
