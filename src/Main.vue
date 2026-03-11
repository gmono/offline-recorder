<template>
  <div id="app" class="min-h-screen">
    <router-view />
    <UiFeedbackHost />
    <UiToastHost />
  </div>
</template>

<script>
import UiFeedbackHost from "@/components/ui/UiFeedbackHost.vue";
import UiToastHost from "@/components/ui/UiToastHost.vue";

export default {
  name: "App",
  components: {
    UiFeedbackHost,
    UiToastHost,
  },
};
</script>
