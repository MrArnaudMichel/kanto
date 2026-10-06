<script lang="ts">
import type { MailFilter } from '../views';

/** What the inbox showed, kept while the reader moves between screens, like the mail itself. */
const kept = { selected: 1 as number | null, filter: 'all' as MailFilter, query: '' };
</script>

<script setup lang="ts">
/** A two-pane mailbox: the list on the left, the message on the right. */
import { toaster, type KtInput, type KtTextarea } from 'kanto-ds';
import { computed, ref, useTemplateRef, watch } from 'vue';
import type { Message } from '../data/api';
import { loadMail, mail } from '../mail';
import { unreadCount, visibleMail } from '../views';

loadMail();
const messages = computed(() => mail.value ?? []);
const selected = ref(kept.selected);
const filter = ref(kept.filter);
const query = ref(kept.query);
watch(
  [selected, filter, query],
  () =>
    Object.assign(kept, {
      selected: selected.value,
      filter: filter.value,
      query: query.value,
    }),
  { flush: 'sync' },
);

const shown = computed(() => visibleMail(messages.value, filter.value, query.value));
const message = computed(() => {
  const found = messages.value.find((candidate) => candidate.id === selected.value);
  return found?.folder === 'inbox' ? found : undefined;
});
const tabs = computed(() => [
  { value: 'all', label: 'All' },
  { value: 'unread', label: `Unread (${unreadCount(messages.value)})` },
  { value: 'starred', label: 'Starred' },
]);

function change(id: number, patch: Partial<Message> | null): void {
  mail.value =
    patch === null
      ? messages.value.filter((candidate) => candidate.id !== id)
      : messages.value.map((candidate) =>
          candidate.id === id ? { ...candidate, ...patch } : candidate,
        );
}

function open(item: Message): void {
  selected.value = item.id;
  change(item.id, { unread: false });
}

function close(done: string): void {
  selected.value = null;
  toaster.success(done);
}

// Replying.
const reply = useTemplateRef<KtTextarea>('reply');
const replyError = ref('');
watch(selected, () => (replyError.value = ''));
function send(to: string): void {
  if (!reply.value?.value.trim()) {
    replyError.value = 'Write a reply first.';
    return;
  }
  replyError.value = '';
  reply.value.value = '';
  toaster.success('Reply sent', { description: `To ${to}.` });
}

// Composing: a dialog that checks its address before it sends.
const composing = ref(false);
const to = useTemplateRef<KtInput>('to');
const subject = useTemplateRef<KtInput>('subject');
const body = useTemplateRef<KtTextarea>('body');
const toError = ref('');
function sendNew(): void {
  const address = to.value?.value.trim() ?? '';
  if (!/^\S+@\S+\.\S+$/.test(address)) {
    toError.value = 'Enter an address like someone@example.com.';
    return;
  }
  toError.value = '';
  composing.value = false;
  toaster.success('Message sent', { description: `To ${address}.` });
  for (const field of [to.value, subject.value, body.value]) if (field) field.value = '';
}
</script>

<template>
  <div class="screen screen-inbox">
    <kt-page-header
      eyebrow="Workspace"
      heading="Inbox"
      description="Everything addressed to the workspace, in one list."
    >
      <kt-button slot="actions" variant="dark" icon="pencil" @click="composing = true">
        Compose
      </kt-button>
    </kt-page-header>

    <div class="mail">
      <div class="mail-list">
        <div class="mail-list-head">
          <kt-input
            placeholder="Search mail…"
            size="small"
            icon="search"
            label="Search mail"
            :value="query"
            @kt-input="(event: CustomEvent<{ value: string }>) => (query = event.detail.value)"
          />
          <kt-tabs
            label="Filter"
            :value="filter"
            :tabs="tabs"
            @kt-change="
              (event: CustomEvent<{ value: MailFilter }>) => (filter = event.detail.value)
            "
          />
        </div>
        <div class="mail-scroll" :aria-busy="mail === null">
          <!-- Until the mail arrives: its shape, not an empty mailbox. -->
          <kt-skeleton v-if="mail === null" variant="text" :count="6" />
          <kt-empty-state
            v-else-if="shown.length === 0"
            compact
            icon="search"
            heading="No messages"
            description="Nothing matches this filter."
          />
          <button
            v-for="item in shown"
            v-else
            :key="item.id"
            type="button"
            :class="['mail-row', { active: item.id === selected }]"
            :aria-current="item.id === selected ? 'true' : undefined"
            @click="open(item)"
          >
            <kt-avatar :name="item.from" size="small" />
            <span class="mail-row-body">
              <span class="mail-row-top">
                <span :class="['mail-from', { unread: item.unread }]">{{ item.from }}</span>
                <span class="mail-time">{{ item.time }}</span>
              </span>
              <span :class="['mail-subject', { unread: item.unread }]">{{ item.subject }}</span>
              <span class="mail-preview">{{ item.preview }}</span>
            </span>
            <kt-icon v-if="item.starred" name="star" :size="14" label="Starred" />
          </button>
        </div>
      </div>

      <div class="mail-reading">
        <template v-if="mail === null" />
        <template v-else-if="message">
          <div class="mail-reading-head">
            <div class="row">
              <kt-avatar :name="message.from" />
              <div class="stack mail-title">
                <strong>{{ message.subject }}</strong>
                <span class="muted small">{{ `${message.from} · ${message.time}` }}</span>
              </div>
            </div>
            <div class="row">
              <kt-tooltip :text="message.starred ? 'Remove the star' : 'Star'">
                <kt-button
                  variant="secondary-no-bg"
                  size="small"
                  icon="star"
                  :label="message.starred ? 'Remove the star' : 'Star'"
                  @click="change(message.id, { starred: !message.starred })"
                />
              </kt-tooltip>
              <kt-button
                variant="secondary-no-bg"
                size="small"
                icon="archive"
                label="Archive"
                @click="(change(message.id, { folder: 'archive' }), close('Message archived'))"
              />
              <kt-button
                variant="secondary-no-bg"
                size="small"
                icon="trash-2"
                label="Delete"
                @click="(change(message.id, null), close('Message deleted'))"
              />
            </div>
          </div>
          <div class="mail-body">
            <p v-for="paragraph in message.body" :key="paragraph">{{ paragraph }}</p>
          </div>
          <div class="mail-reply">
            <kt-textarea
              ref="reply"
              :rows="3"
              :label="`Reply to ${message.from}`"
              :placeholder="`Reply to ${message.from}…`"
              :error="replyError"
            />
            <div class="row end">
              <kt-button icon="send" @click="send(message.from)">Send</kt-button>
            </div>
          </div>
        </template>
        <kt-empty-state
          v-else
          icon="mail"
          heading="Nothing selected"
          description="Pick a message on the left to read it."
        />
      </div>
    </div>

    <kt-modal
      :open="composing"
      heading="New message"
      description="This will be sent from your workspace address."
      @kt-close="((composing = false), (toError = ''))"
    >
      <div class="stack">
        <kt-label-input label="To" required>
          <kt-input ref="to" type="email" placeholder="someone@example.com" :error="toError" />
        </kt-label-input>
        <kt-label-input label="Subject"><kt-input ref="subject" /></kt-label-input>
        <kt-label-input label="Message"><kt-textarea ref="body" :rows="6" /></kt-label-input>
      </div>
      <kt-button slot="footer" variant="dark" @click="composing = false">Cancel</kt-button>
      <kt-button slot="footer" icon="send" @click="sendNew">Send</kt-button>
    </kt-modal>
  </div>
</template>
