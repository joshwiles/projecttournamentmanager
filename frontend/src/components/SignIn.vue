<template>
  <div class="sign-in flex items-center justify-center min-h-[60vh]">
    <div class="w-full max-w-md animate-fade-in">
      <div class="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-gray-700/50">
        <!-- Toggle between Sign In and Sign Up -->
        <div class="flex gap-2 mb-8 bg-gray-700/50 rounded-xl p-1">
          <button
            @click="isSignUp = false"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300',
              !isSignUp
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-300 hover:text-white'
            ]"
          >
            Sign In
          </button>
          <button
            @click="isSignUp = true"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300',
              isSignUp
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-300 hover:text-white'
            ]"
          >
            Sign Up
          </button>
        </div>

        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
          </h2>
          <p class="text-gray-400 text-sm">
            {{ isSignUp ? 'Sign up to get started' : 'Sign in to your account' }}
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400"
              placeholder="Enter your email"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              :minlength="isSignUp ? 6 : undefined"
              class="w-full px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400"
              placeholder="Enter your password"
            />
          </div>

          <!-- Name (only for sign up) -->
          <div v-if="isSignUp">
            <label for="name" class="block text-sm font-semibold text-gray-300 mb-2">
              Name
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              class="w-full px-5 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400"
              placeholder="Enter your name"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-l-4 border-red-500 text-red-300 px-5 py-4 rounded-xl">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">{{ error }}</span>
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="success" class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-l-4 border-green-500 text-green-300 px-5 py-4 rounded-xl">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">{{ success }}</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-bold text-lg shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></span>
              {{ isSignUp ? 'Creating Account...' : 'Signing In...' }}
            </span>
            <span v-else>
              {{ isSignUp ? 'Sign Up' : 'Sign In' }}
            </span>
          </button>
        </form>

        <!-- Close Button -->
        <button
          @click="$emit('close')"
          class="mt-6 w-full text-gray-400 hover:text-gray-200 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { API_BASE } from '../config/api.js';

const emit = defineEmits(['close', 'signed-in', 'signed-up']);

const isSignUp = ref(false);
const email = ref('');
const password = ref('');
const name = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

// Clear messages when switching between sign in/sign up
watch(isSignUp, () => {
  error.value = '';
  success.value = '';
});

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const endpoint = isSignUp ? '/auth/signup' : '/auth/signin';
    
    // Validate required fields
    if (isSignUp && (!email.value || !password.value || !name.value)) {
      error.value = 'Please fill in all fields';
      loading.value = false;
      return;
    }
    
    if (!isSignUp && (!email.value || !password.value)) {
      error.value = 'Please fill in email and password';
      loading.value = false;
      return;
    }
    
    const body = isSignUp
      ? { 
          email: email.value.trim(), 
          password: password.value, 
          name: name.value.trim() 
        }
      : { 
          email: email.value.trim(), 
          password: password.value 
        };

    console.log('Sending request:', { endpoint, body: { ...body, password: '***' } });

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    }

    if (!data.success) {
      throw new Error(data.error || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    }

    if (isSignUp) {
      success.value = 'Account created successfully! You can now sign in.';
      emit('signed-up', data.user);
      // Switch to sign in after successful sign up
      setTimeout(() => {
        isSignUp.value = false;
        success.value = '';
      }, 2000);
    } else {
      // Store token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      emit('signed-in', data.user);
    }

    // Reset form
    email.value = '';
    password.value = '';
    name.value = '';
  } catch (err) {
    console.error('Sign in error:', err);
    error.value = err.message || 'An unexpected error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>

