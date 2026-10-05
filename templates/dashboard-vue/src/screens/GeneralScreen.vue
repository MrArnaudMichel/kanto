<script setup lang="ts">
/** The workspace's name, address, region — and the way to delete it. */
import { toaster, type KtInput } from 'kanto-ds';
import { ref, useTemplateRef } from 'vue';
import { REGION_OPTIONS, WORKSPACE } from '../data/fixtures';

const name = useTemplateRef<KtInput>('name');
const error = ref('');
const saving = ref(false);
const confirming = ref(false);

function save(): void {
  if (!name.value?.value.trim()) {
    error.value = 'The workspace needs a name.';
    return;
  }
  error.value = '';
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
    toaster.success('Workspace updated');
  }, 800);
}

function remove(): void {
  confirming.value = false;
  toaster.info('Deleting a workspace goes to your backend: see src/data/api.ts.');
}
</script>

<template>
  <div class="screen screen-general">
    <kt-page-header
      eyebrow="Settings"
      heading="General"
      description="The name, the address and the defaults everything else inherits."
    />
    <form class="settings-grid" novalidate @submit.prevent="save">
      <kt-form
        heading="Workspace"
        description="How this workspace appears to everyone in it."
        :disabled="saving"
      >
        <kt-label-input label="Name" required>
          <kt-input ref="name" name="name" :value="WORKSPACE.name" required :error="error" />
        </kt-label-input>
        <kt-label-input label="Workspace URL">
          <kt-input name="slug" value="northwind" />
        </kt-label-input>
        <kt-label-input label="Description">
          <kt-textarea name="about" :rows="3" :maxlength="180" />
        </kt-label-input>
        <kt-label-input label="Logo">
          <kt-drag-drop accept="image/*" recommended-size="256×256px" />
        </kt-label-input>
        <kt-button slot="footer" variant="dark" type="reset">Reset</kt-button>
        <kt-button slot="footer" type="submit">{{ saving ? 'Saving…' : 'Save changes' }}</kt-button>
      </kt-form>

      <div class="stack">
        <kt-form heading="Region" description="Where this workspace's data lives.">
          <kt-label-input label="Data residency">
            <kt-select name="region" :options="REGION_OPTIONS" value="eu" :clearable="false" />
          </kt-label-input>
          <kt-alert
            variant="warning"
            description="Moving a workspace between regions takes up to 24 hours and cannot be reversed."
          />
        </kt-form>
        <kt-form heading="Danger zone">
          <kt-alert
            variant="danger"
            heading="Delete this workspace"
            description="Everything in it goes: customers, orders, history."
          >
            <kt-button slot="actions" variant="delete" size="small" @click="confirming = true">
              Delete workspace
            </kt-button>
          </kt-alert>
        </kt-form>
      </div>
    </form>

    <kt-confirm-dialog
      :open="confirming"
      :heading="`Delete ${WORKSPACE.name}?`"
      message="Everything in it goes: customers, orders, history. This cannot be undone."
      confirm-label="Delete workspace"
      variant="danger"
      @kt-confirm="remove"
      @kt-cancel="confirming = false"
    />
  </div>
</template>
