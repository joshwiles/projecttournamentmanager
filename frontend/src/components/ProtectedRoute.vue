<template>
  <div v-if="authLoading" class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center">
      <div :class="['inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4', tc.spinner]"></div>
      <p class="text-gray-400">Loading...</p>
    </div>
  </div>
  <div v-else-if="!isAuthenticated">
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center max-w-md mx-auto px-4">
        <h2 class="text-2xl font-bold text-gray-200 mb-4">Authentication Required</h2>
        <p class="text-gray-400 mb-6">Please sign in to access this page.</p>
        <button
          @click="$emit('redirect-to-login')"
          :class="['text-white px-6 py-3 rounded-lg transition-colors font-semibold min-h-[44px]', tc.buttonSolid]"
        >
          Sign In
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import { useTheme } from '../composables/useTheme.js';

const { user, loading: authLoading } = useAuth();
const { tc } = useTheme();

const isAuthenticated = computed(() => !!user.value);

defineEmits(['redirect-to-login']);
</script>
