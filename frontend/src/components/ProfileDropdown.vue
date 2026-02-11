<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const emit = defineEmits(['navigate', 'sign-out']);

const { user } = useAuth();
const open = ref(false);
const dropdownRef = ref(null);
const buttonRef = ref(null);

const initials = computed(() => {
  const name = user.value?.name || '';
  return name.charAt(0).toUpperCase() || '?';
});

const toggle = () => {
  open.value = !open.value;
};

const handleNavigate = (view) => {
  open.value = false;
  emit('navigate', view);
};

const handleSignOut = () => {
  open.value = false;
  emit('sign-out');
};

const onClickOutside = (event) => {
  if (
    dropdownRef.value && !dropdownRef.value.contains(event.target) &&
    buttonRef.value && !buttonRef.value.contains(event.target)
  ) {
    open.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', onClickOutside);
});
</script>

<template>
  <div class="relative">
    <button
      ref="buttonRef"
      @click="toggle"
      class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 min-h-[44px] min-w-[44px]"
    >
      {{ initials }}
    </button>

    <div
      v-if="open"
      ref="dropdownRef"
      class="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl py-2 z-50"
    >
      <!-- User header -->
      <div class="px-4 py-3 border-b border-gray-700/50">
        <div class="font-semibold text-gray-100 truncate">{{ user?.name || 'User' }}</div>
        <div class="text-sm text-gray-400 truncate">{{ user?.email || '' }}</div>
      </div>

      <!-- Menu items -->
      <div class="py-1">
        <button
          @click="handleNavigate('account')"
          class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700/60 rounded-lg transition-colors min-h-[44px] flex items-center gap-3 mx-0"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account
        </button>
        <button
          @click="handleNavigate('settings')"
          class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700/60 rounded-lg transition-colors min-h-[44px] flex items-center gap-3 mx-0"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      <!-- Divider + Sign Out -->
      <div class="border-t border-gray-700/50 pt-1">
        <button
          @click="handleSignOut"
          class="w-full px-4 py-3 text-left text-gray-400 hover:bg-gray-700/60 hover:text-red-400 rounded-lg transition-colors min-h-[44px] flex items-center gap-3 mx-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>
