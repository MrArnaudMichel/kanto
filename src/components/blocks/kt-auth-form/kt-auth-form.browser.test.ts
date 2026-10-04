/** Signing in from a real keyboard: Tab through, Enter sends. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-auth-form.js';
import type { KtAuthForm, KtAuthSubmitDetail } from 'kanto-ds';

describe('kt-auth-form, typed', () => {
  it('sends on Enter from the password, with what was typed', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    let sent: KtAuthSubmitDetail['values'] | undefined;
    el.addEventListener(
      'kt-submit',
      (event) => (sent = (event as CustomEvent<KtAuthSubmitDetail>).detail.values),
    );
    const email = el.shadowRoot!.querySelector('kt-input[name="email"]')!;
    await userEvent.click(email.shadowRoot!.querySelector('input')!);
    await userEvent.keyboard('dana@northwind.io{Tab}');
    await userEvent.keyboard('correct horse{Enter}');
    expect(sent).toMatchObject({ email: 'dana@northwind.io', password: 'correct horse' });
  });

  it('puts the focus on the first field found wanting', async () => {
    const el = await fixture<KtAuthForm>('<kt-auth-form></kt-auth-form>');
    el.submit();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const focused = el.shadowRoot!.activeElement;
    expect(focused?.getAttribute('name')).toBe('email');
  });
});
