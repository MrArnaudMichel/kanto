# `<kt-auth-form>`

The way into a product: signing in, creating an account, resetting a password,
entering a code — one block, four modes.

```html
<kt-auth-form remember>
  <img slot="logo" src="/logo.svg" alt="Northwind" height="32" />
  <span slot="footer">By continuing you agree to the <a href="/terms">terms</a>.</span>
</kt-auth-form>

<script>
  const form = document.querySelector('kt-auth-form');
  form.addEventListener('kt-submit', (event) => {
    const { mode, values, wait } = event.detail;
    if (mode === 'sign-in') wait(auth.signIn(values.email, values.password));
    if (mode === 'sign-up') wait(auth.signUp(values));
    if (mode === 'forgot') wait(auth.sendReset(values.email));
    if (mode === 'code') wait(auth.verify(values.code));
  });
</script>
```

## Modes

| `mode`    | Asks for                                             | Button         |
| --------- | ---------------------------------------------------- | -------------- |
| `sign-in` | Email, password; "Keep me signed in" with `remember` | Sign in        |
| `sign-up` | Name, email, a new password                          | Create account |
| `forgot`  | Email                                                | Send the link  |
| `code`    | A one-time code, sent as soon as it is whole         | Verify         |

The links between them — "Forgot password?", "Create an account", "Sign in" —
move the form itself and fire `kt-mode`; `goTo(mode)` does the same from
script. Each field has the `autocomplete` a password manager looks for.

## Sending

Before anything is sent the form checks what it can: an email that is one, a
password, a name, a new password at least `password-min` long (8), a whole
code. A field found wanting says why and takes the focus; nothing is sent.

Then `kt-submit` carries the `mode`, the `values` and `wait(promise)`. Hand it
the request: the button runs it — busy, then a tick — and if it rejects, its
error's message is shown above the fields (`error` sets one by hand). A
`forgot` that succeeds says the link is on its way. Enter in a field sends, as
in any form; `submit()` does from script.

## Providers

```js
form.providers = [
  { id: 'github', label: 'Continue with GitHub', icon: 'github' },
  { id: 'google', label: 'Continue with Google' },
];
form.addEventListener('kt-provider', (event) => auth.redirect(event.detail.id));
```

They sit above the fields when signing in or up, set apart by "or". Their icons
are the page's to register.

## Words

Every word is in `texts`, English until given others — headings, leads, labels,
buttons, links and messages:

```js
form.texts = {
  signInHeading: 'Connexion',
  email: 'Adresse e-mail',
  passwordShort: (least) => `Au moins ${least} caractères.`,
};
```

`heading-level` sets the heading's level — 1 by default, since the form is
usually the page — and `plain` drops the card around it.

## Accessibility

A real `<form>`; each field labelled, its error announced with it; the error
from a failed sending shown in an alert. The links between modes are buttons,
since they change the form rather than the page.

## API

| Property       | Attribute       | Type                   | Default     |
| -------------- | --------------- | ---------------------- | ----------- |
| `mode`         | `mode`          | `KtAuthMode`           | `'sign-in'` |
| `providers`    | —               | `KtAuthProvider[]`     | `[]`        |
| `remember`     | `remember`      | `boolean`              | `false`     |
| `passwordMin`  | `password-min`  | `number`               | `8`         |
| `headingLevel` | `heading-level` | `number`               | `1`         |
| `plain`        | `plain`         | `boolean`              | `false`     |
| `error`        | —               | `string`               | `''`        |
| `texts`        | —               | `Partial<KtAuthTexts>` | `{}`        |

| Method       | Description                           |
| ------------ | ------------------------------------- |
| `submit()`   | Checks and sends, as the button does. |
| `goTo(mode)` | Moves the form to another mode.       |

| Event         | Detail                            |
| ------------- | --------------------------------- |
| `kt-submit`   | `{ mode, values, wait(promise) }` |
| `kt-mode`     | `{ mode }`                        |
| `kt-provider` | `{ id }`                          |

| Slot     | Where                          |
| -------- | ------------------------------ |
| `logo`   | Above the heading              |
| `footer` | Under the form: terms, privacy |
