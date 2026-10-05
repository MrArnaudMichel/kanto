<script setup lang="ts">
/** What each role can reach, and how many people hold each. */
import { onBeforeUnmount, shallowRef } from 'vue';
import { capabilityCell, capabilityRows } from '../cells';
import { listMembers, type Member, type Role } from '../data/api';
import { ROLE_ICONS, ROLES } from '../data/fixtures';
import SectionHeader from '../SectionHeader.vue';
import TileCard from '../TileCard.vue';

const ROLE_TONES: Record<Role, 'violet' | 'blue' | 'green' | 'amber'> = {
  Owner: 'violet',
  Admin: 'blue',
  Member: 'green',
  Viewer: 'amber',
};
const COLUMNS = [
  { key: 'capability', label: 'Capability' },
  ...ROLES.map((role) => ({ key: role, label: role, width: '110px', align: 'center' as const })),
];
const ROWS = capabilityRows(ROLES);

const members = shallowRef<readonly Member[]>([]);
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listMembers().then((loaded) => {
  if (live) members.value = loaded;
});

const tileFor = (role: Role) => ({
  label: role,
  value: String(members.value.filter((member) => member.role === role).length),
  icon: ROLE_ICONS[role],
  tone: ROLE_TONES[role],
});
</script>

<template>
  <div class="screen screen-roles">
    <kt-page-header
      eyebrow="Settings"
      heading="Roles"
      description="What each role can reach. Who has which is set on the People screen."
    />
    <kt-alert
      variant="neutral"
      icon="info"
      description="Roles are fixed on this plan. Custom roles come with Enterprise."
    />
    <kt-card>
      <div slot="header" class="card-head"><SectionHeader heading="What each role can do" /></div>
      <kt-table
        label="Capabilities by role"
        compact
        :columns="COLUMNS"
        :data="ROWS"
        :render-cell="capabilityCell"
      />
    </kt-card>
    <div class="tile-row">
      <template v-if="members.length > 0">
        <TileCard v-for="role in ROLES" :key="role" :tile="tileFor(role)" />
      </template>
    </div>
  </div>
</template>
