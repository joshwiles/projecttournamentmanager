<template>
  <div class="flex items-center justify-center min-h-[60vh] py-4 md:py-8">
    <div class="w-full max-w-md animate-fade-in px-4">
      <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 lg:p-12 border border-gray-700/50">
        <div class="text-center mb-6 md:mb-8">
          <h2 :class="['text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-2', tc.headingGradient]">
            Reset Password
          </h2>
          <p class="text-gray-400 text-sm md:text-base">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form v-if="!submitted" @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="reset-email" class="block text-sm md:text-base font-semibold text-gray-300 mb-2">
              Email
            </label>
            <input
              id="reset-email"
              v-model="email"
              type="email"
              required
              ref="emailInput"
              :class="['w-full px-4 md:px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]', tc.focusRing]"
              placeholder="Enter your email"
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
              Sending...
            </span>
            <span v-else>Send Reset Link</span>
          </button>
        </form>

        <div v-else class="text-center space-y-4">
          <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-l-4 border-green-500 text-green-300 px-5 py-4 rounded-xl text-left">
            <span class="font-medium">If an account exists with that email, we've sent a reset link. Check your inbox.</span>
          </div>
        </div>

        <button
          @click="$emit('back')"
          class="mt-6 w-full text-gray-400 active:text-gray-200 hover:text-gray-200 transition-colors text-sm md:text-base font-medium min-h-[44px]"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTheme } from '../composables/useTheme.js';

defineEmits(['back']);

const { tc } = useTheme();

const email = ref('');
const loading = ref(false);
const error = ref('');
const submitted = ref(false);
const emailInput = ref(null);

onMounted(() => {
  emailInput.value?.focus();
});

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      error.value = data.error || 'Something went wrong';
      return;
    }

    submitted.value = true;
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
