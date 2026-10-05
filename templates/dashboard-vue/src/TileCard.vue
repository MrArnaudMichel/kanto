<script setup lang="ts">
/** A figure with its icon chip: the overview's, the files' and the roles' tiles. */
import type { Tile } from './data/api';

defineProps<{ tile: Tile; loading?: boolean }>();
</script>

<template>
  <kt-card class="tile">
    <span :class="`tile-icon ${tile.tone}`">
      <kt-icon :name="tile.icon" :size="18" />
    </span>
    <kt-stat
      :label="tile.label"
      :value="tile.value"
      :delta="tile.delta ?? ''"
      :trend="tile.trend ?? 'flat'"
      :inverted="tile.inverted === true"
      :loading="loading === true"
    />
  </kt-card>
</template>
