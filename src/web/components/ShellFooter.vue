<script setup lang="ts">
import { computed } from 'vue';

import type { SessionResponse } from '../../contracts/api.js';

const props = defineProps<{
  readonly session: SessionResponse;
}>();

const localStatus = computed(() => 'patch' in props.session
  ? 'Local review · frozen patch'
  : 'Local review · pinned commits');
</script>

<template>
  <footer class="shell-footer">
    <span class="shell-footer__local-status">{{ localStatus }}</span>
    <span class="shell-footer__draft-status">Draft stays local · export is explicit</span>
  </footer>
</template>
