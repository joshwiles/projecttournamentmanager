<script setup>
import { ref, watch } from 'vue';
import { useTheme } from '../composables/useTheme.js';

const emit = defineEmits(['back']);

const { themes, currentThemeId, tc, setTheme } = useTheme();

const STORAGE_KEY = 'chess-tm-settings';

const tournamentTypes = [
  { value: 'swiss', label: 'Swiss' },
  { value: 'swiss_uscf', label: 'Swiss USCF' },
  { value: 'swiss_fide_dutch', label: 'Swiss FIDE Dutch' },
  { value: 'swiss_accelerated', label: 'Swiss Accelerated' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'double_round_robin', label: 'Double Round Robin' },
];

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    defaultTournamentType: defaultTournamentType.value,
    defaultRounds: defaultRounds.value,
    boardNumberStart: boardNumberStart.value,
  }));
}

const stored = loadSettings();
const defaultTournamentType = ref(stored.defaultTournamentType || 'swiss_uscf');
const defaultRounds = ref(stored.defaultRounds || 5);
const boardNumberStart = ref(stored.boardNumberStart || 1);

watch([defaultTournamentType, defaultRounds, boardNumberStart], saveSettings);
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

    <h2 :class="['text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-8', tc.headingGradient]">Settings</h2>

    <!-- Tournament Defaults -->
    <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700/50 mb-6">
      <h3 class="text-lg font-semibold text-gray-100 mb-6">Tournament Defaults</h3>

      <div class="space-y-5">
        <div>
          <label for="default-type" class="block text-sm font-semibold text-gray-300 mb-2">Default Tournament Type</label>
          <select
            id="default-type"
            v-model="defaultTournamentType"
            :class="['w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 transition-all duration-300 bg-gray-700/50 text-gray-100 text-base min-h-[44px]', tc.focusRing]"
          >
            <option v-for="t in tournamentTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <div>
          <label for="default-rounds" class="block text-sm font-semibold text-gray-300 mb-2">Default Number of Rounds</label>
          <input
            id="default-rounds"
            v-model.number="defaultRounds"
            type="number"
            min="1"
            max="20"
            :class="['w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 transition-all duration-300 bg-gray-700/50 text-gray-100 text-base min-h-[44px]', tc.focusRing]"
          />
        </div>
      </div>
    </div>

    <!-- Display Preferences -->
    <div class="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700/50">
      <h3 class="text-lg font-semibold text-gray-100 mb-6">Display Preferences</h3>

      <div class="space-y-5">
        <div>
          <label for="board-start" class="block text-sm font-semibold text-gray-300 mb-2">Board Numbering Start</label>
          <input
            id="board-start"
            v-model.number="boardNumberStart"
            type="number"
            min="0"
            max="100"
            :class="['w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 transition-all duration-300 bg-gray-700/50 text-gray-100 text-base min-h-[44px]', tc.focusRing]"
          />
          <p class="text-sm text-gray-400 mt-1">Starting number for board numbering in pairing displays</p>
        </div>

        <!-- Color Theme -->
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-3">Color Theme</label>
          <div class="grid grid-cols-5 gap-3">
            <button
              v-for="theme in themes"
              :key="theme.id"
              @click="setTheme(theme.id)"
              :class="[
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 min-h-[44px]',
                currentThemeId === theme.id
                  ? 'border-white bg-gray-700/60 shadow-lg'
                  : 'border-gray-600/50 hover:border-gray-500 hover:bg-gray-700/30'
              ]"
            >
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-br"
                :style="{ backgroundImage: `linear-gradient(to bottom right, ${theme.preview.from}, ${theme.preview.to})` }"
              ></div>
              <span class="text-xs font-medium text-gray-300">{{ theme.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <p class="text-sm text-gray-500 mt-4 text-center">Settings are saved automatically to your browser.</p>
  </div>
</template>
