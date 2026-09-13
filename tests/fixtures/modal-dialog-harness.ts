import { createApp, ref } from 'vue';

import ModalDialog from '../../src/web/components/ui/ModalDialog.vue';

createApp({
  components: { ModalDialog },
  setup() {
    const open = ref(false);
    return { open };
  },
  template: `
    <button type="button" @click="open = true">Open dialog</button>
    <ModalDialog :open="open" title="Focus harness" close-label="Close dialog" @close="open = false">
      <textarea aria-label="Notes"></textarea>
      <a href="#details">Details</a>
      <button type="button">Last control</button>
    </ModalDialog>
  `,
}).mount('#app');
