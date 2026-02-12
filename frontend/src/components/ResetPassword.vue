<template>
  <div class="flex items-center justify-center min-h-[60vh] py-4 md:py-8">
    <div class="w-full max-w-md animate-fade-in px-4">
      <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 lg:p-12 border border-gray-700/50">
        <div class="text-center mb-6 md:mb-8">
          <h2 :class="['text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-2', tc.headingGradient]">
            Set New Password
          </h2>
          <p class="text-gray-400 text-sm md:text-base">
            Choose a new password for your account
          </p>
        </div>

        <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="new-password" class="block text-sm md:text-base font-semibold text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="new-password"
              v-model="password"
              type="password"
              required
              minlength="8"
              ref="passwordInput"
              :class="['w-full px-4 md:px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]', tc.focusRing]"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label for="confirm-password" class="block text-sm md:text-base font-semibold text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              :class="['w-full px-4 md:px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]', tc.focusRing]"
              placeholder="Re-enter your password"
            />
          </div>

          <div v-if="error" class="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-l-4 border-red-500 text-red-300 px-5 py-4 rounded-xl">
            <span class="font-medium">{{ error }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            :class="['w-full bg-gradient-to-r text-white py-4 px-8 rounded-xl transition-all duration-300 font-bold text-base md:text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]', tc.buttonGradient, tc.buttonHover, tc.buttonActive]"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></span>
              Resetting...
            </span>
            <span v-else>Reset Password</span>
          </button>
        </form>

        <div v-else class="text-center space-y-4">
          <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-l-4 border-green-500 text-green-300 px-5 py-4 rounded-xl text-left">
            <span class="font-medium">Your password has been reset successfully.</span>
          </div>
        </div>

        <button
          @click="$emit('go-to-signin')"
          class="mt-6 w-full text-gray-400 active:text-gray-200 hover:text-gray-200 transition-colors text-sm md:text-base font-medium min-h-[44px]"
        >
          {{ success ? 'Sign In' : 'Back to Sign In' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTheme } from '../composables/useTheme.js';

const props = defineProps({
  token: { type: String, required: true },
});

defineEmits(['go-to-signin']);

const { tc } = useTheme();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);
const passwordInput = ref(null);

onMounted(() => {
  passwordInput.value?.focus();
});

const handleSubmit = async () => {
  error.value = '';

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters long';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: props.token, password: password.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      error.value = data.error || 'Something went wrong';
      return;
    }

    success.value = true;
  } catch {
    error.value = 'Network error. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0.7; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
</style>
