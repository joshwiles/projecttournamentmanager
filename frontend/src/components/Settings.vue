<template>
  <div class="settings flex items-center justify-center min-h-[60vh] py-4 md:py-8">
    <div class="w-full max-w-2xl animate-fade-in px-4">
      <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 lg:p-12 border border-gray-700/50">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Settings
            </h2>
            <p class="text-gray-400 text-sm md:text-base">
              Manage your account preferences
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 text-gray-400 hover:text-gray-200 active:text-gray-100 transition-colors rounded-lg hover:bg-gray-700/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close settings"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- User Info Section -->
        <div class="mb-6 md:mb-8">
          <h3 class="text-lg md:text-xl font-semibold text-gray-200 mb-4">Account Information</h3>
          <div class="bg-gray-700/50 rounded-xl p-4 md:p-6 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-400 mb-2">Name</label>
              <div class="text-base text-gray-200">{{ user?.name || 'Not set' }}</div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-400 mb-2">Email</label>
              <div class="text-base text-gray-200">{{ user?.email || 'Not set' }}</div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-400 mb-2">Account Created</label>
              <div class="text-base text-gray-200">
                {{ user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences Section -->
        <div class="mb-6 md:mb-8">
          <h3 class="text-lg md:text-xl font-semibold text-gray-200 mb-4">Preferences</h3>
          <div class="bg-gray-700/50 rounded-xl p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-semibold text-gray-300 mb-1">Email Notifications</label>
                <p class="text-xs text-gray-400">Receive email updates about your tournaments</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-semibold text-gray-300 mb-1">Dark Mode</label>
                <p class="text-xs text-gray-400">Toggle dark mode (always enabled)</p>
              </div>
              <div class="w-11 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1">
                <div class="w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="border-t border-gray-700/50 pt-6">
          <h3 class="text-lg md:text-xl font-semibold text-gray-200 mb-4">Account Actions</h3>
          <div class="space-y-3">
            <button
              @click="handleChangePassword"
              class="w-full px-4 py-3 bg-gray-700/60 hover:bg-gray-700/80 active:bg-gray-700 rounded-xl text-gray-200 font-semibold transition-colors min-h-[44px] text-left flex items-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
            <button
              @click="handleExportData"
              class="w-full px-4 py-3 bg-gray-700/60 hover:bg-gray-700/80 active:bg-gray-700 rounded-xl text-gray-200 font-semibold transition-colors min-h-[44px] text-left flex items-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export My Data
            </button>
            <button
              @click="handleDeleteAccount"
              class="w-full px-4 py-3 bg-red-900/30 hover:bg-red-900/50 active:bg-red-900/60 border border-red-700/50 rounded-xl text-red-300 font-semibold transition-colors min-h-[44px] text-left flex items-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </button>
          </div>
        </div>

        <!-- Close Button -->
        <button
          @click="$emit('close')"
          class="mt-6 w-full text-gray-400 active:text-gray-200 hover:text-gray-200 transition-colors text-sm md:text-base font-medium min-h-[44px]"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const emit = defineEmits(['close']);

const { user } = useAuth();

const handleChangePassword = () => {
  // TODO: Implement password change
  alert('Password change feature coming soon!');
};

const handleExportData = () => {
  // TODO: Implement data export
  alert('Data export feature coming soon!');
};

const handleDeleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    // TODO: Implement account deletion
    alert('Account deletion feature coming soon!');
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
