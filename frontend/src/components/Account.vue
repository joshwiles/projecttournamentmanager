<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const emit = defineEmits(['back']);

const { user, updateProfile, updatePassword } = useAuth();

// Profile form
const profileName = ref(user.value?.name || '');
const profileEmail = ref(user.value?.email || '');
const profileSuccess = ref('');
const profileError = ref('');
const profileLoading = ref(false);

// Password form
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordSuccess = ref('');
const passwordError = ref('');
const passwordLoading = ref(false);

const handleUpdateProfile = async () => {
  profileSuccess.value = '';
  profileError.value = '';
  profileLoading.value = true;

  try {
    const result = await updateProfile(profileName.value, profileEmail.value);
    if (result.success) {
      profileSuccess.value = 'Profile updated successfully';
    } else {
      profileError.value = result.error;
    }
  } catch (err) {
    profileError.value = 'Failed to update profile';
  } finally {
    profileLoading.value = false;
  }
};

const handleChangePassword = async () => {
  passwordSuccess.value = '';
  passwordError.value = '';

  if (newPassword.value.length < 8) {
    passwordError.value = 'New password must be at least 8 characters';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'New passwords do not match';
    return;
  }

  passwordLoading.value = true;

  try {
    const result = await updatePassword(currentPassword.value, newPassword.value);
    if (result.success) {
      passwordSuccess.value = 'Password changed successfully';
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
    } else {
      passwordError.value = result.error;
    }
  } catch (err) {
    passwordError.value = 'Failed to change password';
  } finally {
    passwordLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto animate-fade-in">
    <!-- Back button -->
    <button
      @click="emit('back')"
      class="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors min-h-[44px]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Dashboard
    </button>

    <h2 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">Account</h2>

    <!-- Profile Section -->
    <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700/50 mb-6">
      <h3 class="text-lg font-semibold text-gray-100 mb-6">Profile</h3>

      <form @submit.prevent="handleUpdateProfile" class="space-y-5">
        <div>
          <label for="profile-name" class="block text-sm font-semibold text-gray-300 mb-2">Name</label>
          <input
            id="profile-name"
            v-model="profileName"
            type="text"
            required
            class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]"
            placeholder="Your name"
          />
        </div>

        <div>
          <label for="profile-email" class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
          <input
            id="profile-email"
            v-model="profileEmail"
            type="email"
            required
            class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]"
            placeholder="Your email"
          />
        </div>

        <!-- Success -->
        <div v-if="profileSuccess" class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-l-4 border-green-500 text-green-300 px-5 py-4 rounded-xl">
          <span class="font-medium">{{ profileSuccess }}</span>
        </div>

        <!-- Error -->
        <div v-if="profileError" class="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-l-4 border-red-500 text-red-300 px-5 py-4 rounded-xl">
          <span class="font-medium">{{ profileError }}</span>
        </div>

        <button
          type="submit"
          :disabled="profileLoading"
          class="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 min-h-[44px] disabled:opacity-50"
        >
          {{ profileLoading ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>

    <!-- Change Password Section -->
    <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700/50">
      <h3 class="text-lg font-semibold text-gray-100 mb-6">Change Password</h3>

      <form @submit.prevent="handleChangePassword" class="space-y-5">
        <div>
          <label for="current-password" class="block text-sm font-semibold text-gray-300 mb-2">Current Password</label>
          <input
            id="current-password"
            v-model="currentPassword"
            type="password"
            required
            class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label for="new-password" class="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]"
            placeholder="Enter new password (min 8 characters)"
          />
        </div>

        <div>
          <label for="confirm-password" class="block text-sm font-semibold text-gray-300 mb-2">Confirm New Password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 placeholder-gray-400 text-base min-h-[44px]"
            placeholder="Confirm new password"
          />
        </div>

        <!-- Success -->
        <div v-if="passwordSuccess" class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-l-4 border-green-500 text-green-300 px-5 py-4 rounded-xl">
          <span class="font-medium">{{ passwordSuccess }}</span>
        </div>

        <!-- Error -->
        <div v-if="passwordError" class="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-l-4 border-red-500 text-red-300 px-5 py-4 rounded-xl">
          <span class="font-medium">{{ passwordError }}</span>
        </div>

        <button
          type="submit"
          :disabled="passwordLoading"
          class="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 min-h-[44px] disabled:opacity-50"
        >
          {{ passwordLoading ? 'Changing...' : 'Change Password' }}
        </button>
      </form>
    </div>
  </div>
</template>
