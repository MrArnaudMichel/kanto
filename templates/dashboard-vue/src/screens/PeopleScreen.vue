<script setup lang="ts">
/** Who is in the workspace, and the way to take someone out of it. */
import { toaster } from 'kanto-ds';
import { onBeforeUnmount, shallowRef } from 'vue';
import { memberCell } from '../cells';
import { listMembers, removeMember, type Member } from '../data/api';

const COLUMNS = [
  { key: 'name', label: 'Person', sortable: true },
  { key: 'role', label: 'Role', sortable: true, width: '140px' },
  { key: 'seen', label: 'Last seen', width: '140px' },
  { key: 'actions', label: '', width: '60px', align: 'right' as const },
];

const members = shallowRef<readonly Member[] | null>(null);
const removing = shallowRef<Member | null>(null);
const renderMember = memberCell((member) => (removing.value = member));
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listMembers().then((loaded) => {
  if (live) members.value = loaded;
});

function remove(): void {
  const member = removing.value;
  removing.value = null;
  if (!member) return;
  void removeMember(member.id).then(async () => {
    members.value = await listMembers();
    toaster.success(`${member.name} removed`);
  });
}
</script>

<template>
  <div class="screen screen-people">
    <kt-page-header
      eyebrow="Settings"
      heading="People"
      description="Who is in this workspace, and when each of them was last here."
    />
    <kt-card>
      <div slot="header" class="row between card-head">
        <h2 class="card-title">People with access</h2>
        <kt-button
          size="small"
          icon="plus"
          @click="toaster.info('Invitations go out from your backend: see src/data/api.ts.')"
        >
          Invite
        </kt-button>
      </div>
      <kt-table
        label="Members"
        :loading="members === null"
        :columns="COLUMNS"
        :data="members ?? []"
        :render-cell="renderMember"
      />
    </kt-card>

    <kt-confirm-dialog
      :open="removing !== null"
      :heading="`Remove ${removing?.name ?? ''}?`"
      message="They lose access at once."
      confirm-label="Remove"
      variant="danger"
      @kt-confirm="remove"
      @kt-cancel="removing = null"
    />
  </div>
</template>
