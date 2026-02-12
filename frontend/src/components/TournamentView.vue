<template>
  <div class="tournament-view">
    <div v-if="loading" class="text-center py-8">
      <div class="text-gray-500">Loading tournament...</div>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div class="font-semibold mb-2">⚠️ API Connection Error</div>
      <div class="text-sm whitespace-pre-line">{{ error }}</div>
      <div class="mt-3 text-xs text-red-600">
        <strong>Quick Fix:</strong> Check browser console (F12) for detailed error information.
      </div>
    </div>

    <div v-else-if="tournament">
      <!-- Tournament Header -->
      <div class="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl font-bold mb-2 break-words">{{ tournament.name }}</h1>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base text-gray-600">
              <span>Rounds: {{ tournament.currentRound }} / {{ tournament.numberOfRounds }}</span>
              <span>Players: {{ tournament.players.length }}</span>
              <div class="flex gap-2 flex-wrap">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="{
                    'bg-purple-100 text-purple-800': tournament.tournamentType === 'round_robin',
                    'bg-indigo-100 text-indigo-800': tournament.tournamentType === 'double_round_robin',
                    'bg-blue-50 text-blue-700': !tournament.tournamentType || tournament.tournamentType.startsWith('swiss'),
                  }"
                >
                  {{ tournamentTypeLabel }}
                </span>
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': tournament.status === 'registration',
                    'bg-green-100 text-green-800': tournament.status === 'in_progress',
                    'bg-gray-100 text-gray-800': tournament.status === 'completed',
                  }"
                >
                  {{ statusLabel }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div v-if="isAuthenticated" class="flex items-center gap-2">
              <button
                @click="saveTournament()"
                :disabled="saving"
                :class="['w-full sm:w-auto px-4 py-2 rounded-md min-h-[44px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors', tc.buttonSolid]"
              >
                {{ saving ? 'Saving...' : (savedId || tournament?._savedId ? 'Update Save' : 'Save Tournament') }}
              </button>
              <span v-if="saveMessage" class="text-sm font-medium" :class="saveMessage.startsWith('Save failed') ? 'text-red-600' : 'text-green-600'">
                {{ saveMessage }}
              </span>
            </div>
            <button
              @click="handleBack()"
              class="w-full sm:w-auto text-gray-500 active:text-gray-700 hover:text-gray-700 px-4 py-2 rounded-md active:bg-gray-100 min-h-[44px] text-left sm:text-center font-medium"
            >
              ← Back to Tournaments
            </button>
          </div>
        </div>
      </div>

      <!-- Player Management (only during registration) -->
      <PlayerManager
        v-if="tournament.status === 'registration'"
        :tournament-id="tournament.id"
        :players="tournament.players"
        :tournament-status="tournament.status"
        @player-added="handlePlayerChange"
        @player-removed="handlePlayerChange"
        @tournament-started="handlePlayerChange"
        class="mb-4 md:mb-6"
      />

      <!-- Standings -->
      <Standings
        v-if="tournament.status !== 'registration'"
        :standings="standings"
        :tournament="tournament"
        class="mb-4 md:mb-6"
      />

      <!-- Round Pairings -->
      <RoundPairings
        v-if="tournament.status === 'in_progress' || tournament.status === 'completed'"
        :tournament-id="tournament.id"
        :round="currentRoundData"
        :current-round="tournament.currentRound"
        @round-completed="handleRoundCompleted"
        @result-updated="loadTournament(false)"
        class="mb-4 md:mb-6"
      />

      <!-- Game Results History -->
      <GameResults
        v-if="tournament.status === 'in_progress' || tournament.status === 'completed'"
        :tournament="tournament"
        class="mb-4 md:mb-6"
      />

      <!-- Tournament Complete Message -->
      <div v-if="tournament.status === 'completed'" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p class="font-bold text-lg">🎉 Tournament Completed!</p>
        <p class="mt-2">Congratulations to all participants!</p>
      </div>
    </div>

    <!-- Login prompt modal -->
    <div v-if="showLoginPrompt" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div v-if="!showInlineAuth" class="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-white mb-2">Tournament Not Saved</h3>
        <p class="text-gray-400 mb-5">
          {{ loginPromptReason === 'exit' ? 'If you leave now, this tournament will not be saved.' : 'Your completed tournament has not been saved.' }}
          Sign in or sign up to save it permanently.
        </p>
        <div class="flex flex-col gap-2">
          <button
            @click="showInlineAuth = true"
            :class="['w-full px-4 py-3 rounded-lg font-medium text-white min-h-[44px] transition-colors', tc.buttonSolid]"
          >
            Sign In / Sign Up
          </button>
          <button
            @click="dismissLoginPrompt()"
            class="w-full px-4 py-3 rounded-lg font-medium text-gray-400 hover:bg-gray-700 min-h-[44px] transition-colors"
          >
            {{ loginPromptReason === 'exit' ? 'Leave Without Saving' : 'Dismiss' }}
          </button>
        </div>
      </div>
      <div v-else class="w-full max-w-md">
        <SignIn
          @close="showInlineAuth = false"
          @signed-in="handleModalSignedIn"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import PlayerManager from './PlayerManager.vue';
import RoundPairings from './RoundPairings.vue';
import Standings from './Standings.vue';
import GameResults from './GameResults.vue';
import SignIn from './SignIn.vue';
import { API_BASE } from '../config/api.js';
import { safeJsonParse, handleNetworkError } from '../utils/apiHelpers.js';
import { useAuth } from '../composables/useAuth.js';
import { useTheme } from '../composables/useTheme.js';

const { isAuthenticated } = useAuth();
const { tc } = useTheme();

const props = defineProps({
  tournamentId: {
    type: Number,
    required: true,
  },
  initialSavedId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['close-tournament']);

const tournament = ref(null);
const standings = ref([]);
const loading = ref(true);
const error = ref('');
const savedId = ref(props.initialSavedId);
const saving = ref(false);
const saveMessage = ref('');
const showLoginPrompt = ref(false);
const showInlineAuth = ref(false);
const loginPromptReason = ref('exit'); // 'exit' or 'completed'

const statusLabel = computed(() => {
  if (!tournament.value) return '';
  const status = tournament.value.status;
  if (status === 'registration') return 'Registration';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  return status;
});

const tournamentTypeLabel = computed(() => {
  if (!tournament.value) return '';
  const type = tournament.value.tournamentType || 'swiss';
  if (type === 'round_robin') return 'Round Robin';
  if (type === 'double_round_robin') return 'Double Round Robin';
  if (type === 'swiss_uscf') return 'Swiss (USCF)';
  if (type === 'swiss_fide_dutch') return 'Swiss (FIDE Dutch)';
  if (type === 'swiss_accelerated') return 'Swiss (Accelerated)';
  return 'Swiss';
});

const currentRoundData = computed(() => {
  if (!tournament.value || !tournament.value.rounds) return null;
  return tournament.value.rounds.find(r => r.roundNumber === tournament.value.currentRound) || null;
});

const loadTournament = async (showLoading = true) => {
  // Save scroll position before loading
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  
  if (showLoading) {
    loading.value = true;
  }
  error.value = '';

  try {
    const url = `${API_BASE}/tournaments/${props.tournamentId}`;
    const response = await fetch(url, {
      credentials: 'include'
    }).catch((fetchError) => {
      throw handleNetworkError(fetchError, url);
    });
    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load tournament');
    }

    tournament.value = data.tournament;
    standings.value = data.tournament.standings || [];

    // Restore scroll position after DOM update
    await nextTick();
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  } catch (err) {
    error.value = err.message;
  } finally {
    if (showLoading) {
      loading.value = false;
    }
  }
};

const handlePlayerChange = async () => {
  await loadTournament(false);
  if (isAuthenticated.value && (savedId.value || tournament.value?._savedId)) {
    saveTournament();
  }
};

const handleRoundCompleted = async (data) => {
  if (data.tournament) {
    tournament.value.status = data.tournament.status;
    tournament.value.currentRound = data.tournament.currentRound;
  }
  if (data.standings) {
    standings.value = data.standings;
  }
  await loadTournament(false);
  if (isAuthenticated.value && (savedId.value || tournament.value?._savedId)) {
    saveTournament();
  } else if (!isAuthenticated.value && tournament.value?.status === 'completed') {
    loginPromptReason.value = 'completed';
    showLoginPrompt.value = true;
  }
};

const handleBack = () => {
  if (!isAuthenticated.value) {
    loginPromptReason.value = 'exit';
    showLoginPrompt.value = true;
  } else {
    emit('close-tournament');
  }
};

const dismissLoginPrompt = () => {
  showLoginPrompt.value = false;
  showInlineAuth.value = false;
  if (loginPromptReason.value === 'exit') {
    emit('close-tournament');
  }
};

const handleModalSignedIn = async () => {
  showLoginPrompt.value = false;
  showInlineAuth.value = false;
  await saveTournament();
  if (loginPromptReason.value === 'exit') {
    emit('close-tournament');
  }
};

const saveTournament = async () => {
  if (!tournament.value || saving.value) return;
  saving.value = true;
  saveMessage.value = '';

  try {
    // Check if the tournament has a _savedId from loading
    const effectiveSavedId = savedId.value || tournament.value._savedId;
    const isUpdate = !!effectiveSavedId;
    const url = isUpdate
      ? `${API_BASE}/saved-tournaments/${effectiveSavedId}`
      : `${API_BASE}/saved-tournaments`;
    const method = isUpdate ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tournament: tournament.value }),
    });
    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save tournament');
    }

    savedId.value = data.savedTournament.id;
    saveMessage.value = 'Saved!';
    setTimeout(() => { saveMessage.value = ''; }, 2000);
  } catch (err) {
    saveMessage.value = 'Save failed: ' + err.message;
    setTimeout(() => { saveMessage.value = ''; }, 4000);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadTournament();
});

// Poll for updates every 5 seconds if tournament is in progress
let pollInterval = null;

watch(
  () => tournament.value?.status,
  (status) => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    if (status === 'in_progress') {
      pollInterval = setInterval(() => {
        loadTournament(false); // Don't show loading state for polling
      }, 5000);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});
</script>

