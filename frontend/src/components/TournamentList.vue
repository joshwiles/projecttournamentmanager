<template>
  <div class="tournament-list">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 md:mb-6">
      <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
      </h1>
      <button
        @click="showCreator = true"
        class="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 md:py-2 rounded-md active:bg-blue-700 hover:bg-blue-700 transition-colors font-semibold min-h-[44px]"
      >
        + New Tournament
      </button>
    </div>

    <TournamentCreator
      v-if="showCreator"
      @tournament-created="handleTournamentCreated"
      class="mb-6"
    />

    <div v-if="loading" class="text-center py-8">
      <div class="text-gray-500">Loading tournaments...</div>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div class="font-semibold mb-2">⚠️ API Connection Error</div>
      <div class="text-sm whitespace-pre-line">{{ error }}</div>
      <div class="mt-3 text-xs text-red-600">
        <strong>Quick Fix:</strong> Check browser console (F12) for detailed error information.
      </div>
    </div>

    <div v-else-if="tournaments.length === 0" class="bg-white rounded-lg shadow-md p-8 text-center">
      <p class="text-gray-500 mb-4">No tournaments yet. Create your first tournament to get started!</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="tournament in tournaments"
        :key="tournament.id"
        class="bg-white rounded-lg shadow-md p-4 md:p-6 relative group"
      >
        <div
          @click="selectTournament(tournament.id)"
          class="cursor-pointer transition-shadow touch-manipulation"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-lg md:text-xl font-bold flex-1 pr-2">{{ tournament.name }}</h3>
            <div class="relative delete-popover-container">
              <button
                @click.stop="confirmDeleteTournament(tournament, $event)"
                :disabled="deletingTournamentId === tournament.id"
                class="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-2 text-red-600 hover:text-red-800 active:text-red-900 rounded-md hover:bg-red-50 active:bg-red-100 hover:shadow-lg active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete tournament"
                title="Delete tournament"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              <!-- Delete Confirmation Popover -->
              <div
                v-if="showDeleteConfirm?.id === tournament.id"
                @click.stop
                class="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px] md:min-w-[320px]"
                style="transform: translateX(calc(100% - 44px));"
              >
                <div class="text-sm font-semibold text-gray-900 mb-2">
                  Delete Tournament?
                </div>
                <div class="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete <strong>"{{ showDeleteConfirm.name }}"</strong>? This action cannot be undone.
                </div>
                <div class="flex gap-2 justify-end">
                  <button
                    @click.stop="cancelDelete"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    @click.stop="confirmDelete"
                    :disabled="deletingTournamentId === tournament.id"
                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {{ deletingTournamentId === tournament.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="text-sm md:text-base text-gray-600 space-y-1.5">
            <p>Rounds: {{ tournament.currentRound }} / {{ tournament.numberOfRounds }}</p>
            <p>Players: {{ tournament.playerCount }}</p>
            <p class="flex gap-2 flex-wrap">
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-purple-100 text-purple-800': tournament.tournamentType === 'round_robin',
                  'bg-indigo-100 text-indigo-800': tournament.tournamentType === 'double_round_robin',
                  'bg-blue-50 text-blue-700': !tournament.tournamentType || tournament.tournamentType.startsWith('swiss'),
                }"
              >
                {{ getTournamentTypeLabel(tournament.tournamentType) }}
              </span>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800': tournament.status === 'registration',
                  'bg-green-100 text-green-800': tournament.status === 'in_progress',
                  'bg-gray-100 text-gray-800': tournament.status === 'completed',
                }"
              >
                {{ getStatusLabel(tournament.status) }}
              </span>
            </p>
            <p class="text-xs text-gray-400 mt-2">
              Created: {{ formatDate(tournament.createdAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import TournamentCreator from './TournamentCreator.vue';
import { API_BASE } from '../config/api.js';
import { safeJsonParse, handleNetworkError } from '../utils/apiHelpers.js';

const emit = defineEmits(['tournament-selected']);

const tournaments = ref([]);
const loading = ref(true);
const error = ref('');
const showCreator = ref(false);
const deletingTournamentId = ref(null);
const showDeleteConfirm = ref(null); // { id, name, buttonElement }

const getStatusLabel = (status) => {
  if (status === 'registration') return 'Registration';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  return status;
};

const getTournamentTypeLabel = (type) => {
  if (type === 'round_robin') return 'Round Robin';
  if (type === 'double_round_robin') return 'Double Round Robin';
  if (type === 'swiss_uscf') return 'Swiss (USCF)';
  if (type === 'swiss_fide_dutch') return 'Swiss (FIDE Dutch)';
  if (type === 'swiss_accelerated') return 'Swiss (Accelerated)';
  return 'Swiss';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const loadTournaments = async () => {
  loading.value = true;
  error.value = '';

  try {
    const url = `${API_BASE}/tournaments`;
    const response = await fetch(url, {
      credentials: 'include'
    }).catch((fetchError) => {
      throw handleNetworkError(fetchError, url);
    });
    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load tournaments');
    }

    tournaments.value = data.tournaments || [];
  } catch (err) {
    console.error('Error loading tournaments:', err);
    error.value = err.message || 'Failed to load tournaments. Please check your API configuration.';
  } finally {
    loading.value = false;
  }
};

const handleTournamentCreated = (newTournament) => {
  showCreator.value = false;
  loadTournaments();
  // Auto-select the new tournament
  selectTournament(newTournament.id);
};

const selectTournament = (tournamentId) => {
  emit('tournament-selected', tournamentId);
};

const confirmDeleteTournament = (tournament, event) => {
  // Store button position for popover placement
  const buttonElement = event?.currentTarget || event?.target;
  showDeleteConfirm.value = {
    id: tournament.id,
    name: tournament.name,
    buttonElement: buttonElement
  };
};

const cancelDelete = () => {
  showDeleteConfirm.value = null;
};

const confirmDelete = () => {
  if (showDeleteConfirm.value) {
    const tournamentId = showDeleteConfirm.value.id;
    showDeleteConfirm.value = null;
    deleteTournament(tournamentId);
  }
};

const deleteTournament = async (tournamentId) => {
  deletingTournamentId.value = tournamentId;
  error.value = '';

  try {
    const url = `${API_BASE}/tournaments/${tournamentId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
    }).catch((fetchError) => {
      throw handleNetworkError(fetchError, url);
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete tournament');
    }

    // Remove tournament from list
    tournaments.value = tournaments.value.filter(t => t.id !== tournamentId);
  } catch (err) {
    console.error('Error deleting tournament:', err);
    error.value = err.message || 'Failed to delete tournament. Please try again.';
  } finally {
    deletingTournamentId.value = null;
  }
};

// Close popover when clicking outside
const handleClickOutside = (event) => {
  if (showDeleteConfirm.value && !event.target.closest('.delete-popover-container')) {
    showDeleteConfirm.value = null;
  }
};

onMounted(() => {
  loadTournaments();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
