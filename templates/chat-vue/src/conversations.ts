/**
 * The conversations, as plain data and functions that return new data — so
 * every stack keeps them in its own state, and a reply streaming into one
 * conversation never touches another.
 */
export interface Message {
  readonly id: number;
  readonly from: 'user' | 'assistant';
  readonly text: string;
  readonly streaming: boolean;
}

export interface Conversation {
  readonly id: number;
  readonly title: string;
  readonly messages: readonly Message[];
}

const UNTITLED = 'New chat';
let next = 1000;

/** A conversation's title from its first question: at most 48 characters, cut at a word. */
export function titleOf(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= 48) return clean;
  const cut = clean.slice(0, 47);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}

export function newConversation(list: readonly Conversation[]): {
  list: Conversation[];
  id: number;
} {
  const id = (next += 1);
  return { list: [{ id, title: UNTITLED, messages: [] }, ...list], id };
}

/** The question, and an empty reply to stream into. Null when there is nothing to ask. */
export function addQuestion(
  list: readonly Conversation[],
  id: number,
  text: string,
): { list: Conversation[]; replyId: number } | null {
  const question = text.trim();
  if (!question) return null;
  const replyId = (next += 2);
  return {
    replyId,
    list: list.map((conversation) =>
      conversation.id !== id
        ? conversation
        : {
            ...conversation,
            title: conversation.messages.length === 0 ? titleOf(question) : conversation.title,
            messages: [
              ...conversation.messages,
              { id: replyId - 1, from: 'user', text: question, streaming: false },
              { id: replyId, from: 'assistant', text: '', streaming: true },
            ],
          },
    ),
  };
}

function updateMessage(
  list: readonly Conversation[],
  conversationId: number,
  messageId: number,
  change: (message: Message) => Message,
): Conversation[] {
  return list.map((conversation) =>
    conversation.id !== conversationId
      ? conversation
      : {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? change(message) : message,
          ),
        },
  );
}

export function appendToken(
  list: readonly Conversation[],
  conversationId: number,
  messageId: number,
  token: string,
): Conversation[] {
  return updateMessage(list, conversationId, messageId, (message) => ({
    ...message,
    text: message.text + token,
  }));
}

export function finishReply(
  list: readonly Conversation[],
  conversationId: number,
  messageId: number,
): Conversation[] {
  return updateMessage(list, conversationId, messageId, (message) => ({
    ...message,
    streaming: false,
  }));
}
