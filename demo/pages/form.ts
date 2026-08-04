import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';
import { rerender } from '../lib/render.js';
import { PLANS, REGIONS } from '../lib/data.js';

/**
 * A form that behaves like one.
 *
 * Fields validate as you leave them, the plan changes which fields exist,
 * saving disables the panels and reports what the server would have received,
 * and resetting a dirty form asks first. Every field is form-associated, so
 * the payload comes straight out of `FormData` with no wiring.
 */

interface State {
  errors: Record<string, string>;
  saving: boolean;
  loading: boolean;
  plan: string;
  seats: number;
  dirty: boolean;
  confirmReset: boolean;
  payload: [string, string][] | null;
}

const state: State = {
  errors: {},
  saving: false,
  loading: false,
  plan: 'Pro',
  seats: 12,
  dirty: false,
  confirmReset: false,
  payload: null,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(name: string, value: string): string {
  if (name === 'company') return value.trim() ? '' : 'A company name is required.';
  if (name === 'email') {
    if (!value.trim()) return 'An email address is required.';
    return EMAIL.test(value) ? '' : 'That does not look like an email address.';
  }
  if (name === 'seats') {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? '' : 'At least one seat.';
  }
  return '';
}

function check(name: string, value: string): void {
  const message = validate(name, value);
  if (message) state.errors[name] = message;
  else delete state.errors[name];
  rerender();
}

function onInput(name: string) {
  return (event: CustomEvent<{ value: string }>) => {
    state.dirty = true;
    // Only clear an error while typing; do not raise a new one mid-word.
    if (state.errors[name] && !validate(name, event.detail.value)) {
      delete state.errors[name];
      rerender();
    }
  };
}

function onSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const data = new FormData(form);

  // FormData entries are string | File; only a file input yields the latter,
  // and none of the validated fields is one.
  const text = (field: string): string => {
    const value = data.get(field);
    return typeof value === 'string' ? value : '';
  };

  for (const field of ['company', 'email', ...(state.plan === 'Enterprise' ? ['seats'] : [])]) {
    const message = validate(field, text(field));
    if (message) state.errors[field] = message;
  }

  if (Object.keys(state.errors).length > 0) {
    rerender();
    toaster.error('Check the highlighted fields', {
      description: `${Object.keys(state.errors).length} field(s) need attention.`,
    });
    return;
  }

  state.saving = true;
  rerender();

  setTimeout(() => {
    state.saving = false;
    state.dirty = false;
    state.payload = [...data.entries()].map(([key, value]) => [
      key,
      value instanceof File ? value.name : String(value),
    ]);
    rerender();
    toaster.success('Entity created', { description: 'The payload is shown below the form.' });
  }, 1100);
}

function doReset(form: HTMLFormElement): void {
  form.reset();
  state.errors = {};
  state.dirty = false;
  state.payload = null;
  state.confirmReset = false;
  rerender();
  toaster.info('Form reset');
}

export function formPage(): TemplateResult {
  const err = (name: string) => state.errors[name] ?? '';

  return html`
    <header class="page-header">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div class="stack" style="gap:6px">
          <h1>Create an entity</h1>
          <p>
            Fields validate as you leave them, the plan decides which fields exist, and saving
            reports exactly what <code>FormData</code> collected — every Kanto field is a
            form-associated custom element, so nothing is wired by hand.
          </p>
        </div>
        <kt-toggle
          size="small"
          ?checked=${state.loading}
          @kt-change=${(e: CustomEvent<{ checked: boolean }>) => {
            state.loading = e.detail.checked;
            rerender();
          }}
          >Loading state</kt-toggle
        >
      </div>
    </header>

    <form
      @submit=${onSubmit}
      @reset=${(e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        if (state.dirty) {
          state.confirmReset = true;
          rerender();
        } else doReset(form);
      }}
    >
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start">
        <kt-form
          heading="Identity"
          description="How the entity is addressed everywhere else."
          ?loading=${state.loading}
          ?disabled=${state.saving}
        >
          <kt-label-input label="Company name" required>
            <kt-input
              name="company"
              required
              value="Kanto Studio"
              error=${err('company')}
              @kt-input=${onInput('company')}
              @kt-change=${(e: CustomEvent<{ value: string }>) => check('company', e.detail.value)}
            ></kt-input>
          </kt-label-input>

          <kt-label-input label="Email address" required>
            <kt-input
              name="email"
              type="email"
              required
              placeholder="hello@example.com"
              error=${err('email')}
              @kt-input=${onInput('email')}
              @kt-change=${(e: CustomEvent<{ value: string }>) => check('email', e.detail.value)}
            ></kt-input>
          </kt-label-input>

          <kt-label-input label="Phone">
            <kt-input name="phone" type="tel" @kt-input=${onInput('phone')}></kt-input>
          </kt-label-input>

          <kt-label-input label="Region">
            <kt-select
              name="region"
              placeholder="Select a region"
              .options=${REGIONS.map((r) => ({ id: r, label: r }))}
            ></kt-select>
          </kt-label-input>
        </kt-form>

        <kt-form
          heading="Subscription"
          description="Changing the plan changes what else you are asked."
          ?loading=${state.loading}
          ?disabled=${state.saving}
        >
          <kt-label-input label="Plan">
            <kt-segmented-control
              label="Plan"
              .value=${state.plan}
              .options=${PLANS.map((p) => ({ value: p, label: p }))}
              @kt-change=${(e: CustomEvent<{ value: string }>) => {
                state.plan = e.detail.value;
                state.dirty = true;
                if (e.detail.value !== 'Enterprise') delete state.errors['seats'];
                rerender();
              }}
            ></kt-segmented-control>
          </kt-label-input>

          ${
            state.plan === 'Enterprise'
              ? html`<kt-label-input label="Seats" required>
                  <kt-input
                    name="seats"
                    type="number"
                    value=${String(state.seats)}
                    error=${err('seats')}
                    @kt-input=${onInput('seats')}
                    @kt-change=${(e: CustomEvent<{ value: string }>) => check('seats', e.detail.value)}
                  ></kt-input>
                </kt-label-input>`
              : ''
          }

          <kt-label-input label="Internal notes">
            <kt-textarea
              name="notes"
              maxlength="280"
              rows="3"
              @kt-input=${onInput('notes')}
            ></kt-textarea>
          </kt-label-input>

          <kt-toggle name="newsletter" value="yes" checked>Receive product news</kt-toggle>
          <kt-toggle name="beta" value="yes">Access to beta features</kt-toggle>

          <kt-label-input label="Logo">
            <kt-drag-drop accept="image/*" max-size="2097152" recommended-size="512×512px">
            </kt-drag-drop>
          </kt-label-input>
        </kt-form>
      </div>

      <div class="row" style="justify-content:space-between;margin-top:20px">
        <span class="muted" style="font:var(--font-normal-small)">
          ${state.dirty ? 'Unsaved changes' : 'No changes'}
        </span>
        <div class="row">
          <kt-button variant="dark" type="reset" ?disabled=${state.saving}>Reset</kt-button>
          <kt-button type="submit" icon="check" ?disabled=${state.saving}
            >${state.saving ? 'Saving…' : 'Create entity'}</kt-button
          >
        </div>
      </div>

      ${
        state.saving
          ? html`<kt-progress-bar
              striped
              animated
              value="70"
              size="small"
              label="Saving"
              style="margin-top:12px"
            ></kt-progress-bar>`
          : ''
      }
    </form>

    ${
      state.payload
        ? html`<section style="margin-top:32px">
            <h6>What the server received</h6>
            <kt-code language="json" copy
              >${JSON.stringify(Object.fromEntries(state.payload), null, 2)}</kt-code
            >
          </section>`
        : ''
    }

    <kt-confirm-dialog
      ?open=${state.confirmReset}
      heading="Discard your changes?"
      message="The form has unsaved changes. Resetting clears them."
      confirm-label="Discard"
      @kt-confirm=${() => {
        const form = document.querySelector('main form');
        if (form instanceof HTMLFormElement) doReset(form);
      }}
      @kt-cancel=${() => {
        state.confirmReset = false;
        rerender();
      }}
    ></kt-confirm-dialog>
  `;
}
