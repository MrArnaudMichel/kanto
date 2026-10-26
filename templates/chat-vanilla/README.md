# Atlas — an assistant on Kanto, in TypeScript without a framework

An assistant to start from: conversations down the side, the transcript, and
a prompt — the answer streamed a word at a time. The model is one function,
`reply()` in `src/model.ts`: it streams a canned answer until you point it at a
real one. Built from [Kanto](https://kanto.arnaudmichel.fr)'s components.

```bash
npm install
npm run dev
```

## Where things are

| To change         | Edit                                      |
| ----------------- | ----------------------------------------- |
| The model         | `src/model.ts` — call your model here     |
| What it says      | `src/content.ts`                          |
| The conversations | `src/conversations.ts`                    |
| The brand         | `src/brand.ts` — one `setAppearance` call |
| The app           | `src/main.ts`                             |

Open the app with `#new` to start on a new conversation.

## Components used

`kt-app-shell`, `kt-button`, `kt-chat-message`, `kt-prompt-input`,
`kt-empty-state`. Each is documented at
https://kanto.arnaudmichel.fr/components.
