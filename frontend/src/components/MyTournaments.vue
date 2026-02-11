<template>
  <div class="my-tournaments">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-white">{{ isAuthenticated ? 'My Saved Tournaments' : 'My Tournaments' }}</h2>
    </div>

    <div v-if="!isAuthenticated" class="mb-6 px-4 py-3 rounded-lg bg-amber-900/30 border border-amber-700/50 text-amber-200 text-sm">
      These tournaments are saved to your current session only. Sign in or sign up to save them permanently and access them across devices.
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
      <p class="text-gray-400">Loading tournaments...</p>
    </div>

    <div v-else-if="error" class="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-else-if="tournaments.length === 0" class="text-center py-12">
      <p class="text-gray-400 text-lg mb-2">No tournaments yet.</p>
      <p class="text-gray-500 text-sm">{{ isAuthenticated ? 'Open a tournament and click "Save Tournament" to save it here.' : 'Create a tournament from the dashboard to get started.' }}</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="t in tournaments"
        :key="t.id"
        class="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors"
      >
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white mb-2 break-words">{{ t.name }}</h3>
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
              {{ typeLabel(t.tournament_type) }}
            </span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-blue-900/60 text-blue-300': t.status === 'registration',
                'bg-green-900/60 text-green-300': t.status === 'in_progress',
                'bg-gray-700 text-gray-400': t.status === 'completed',
              }"
            >
              {{ statusLabel(t.status) }}
            </span>
          </div>
          <div class="text-sm text-gray-400 space-y-1">
            <div>Players: {{ t.player_count }}</div>
            <div>Round: {{ t.current_round }} / {{ t.number_of_rounds }}</div>
            <div>Last saved: {{ formatDate(t.updated_at) }}</div>
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <button
            @click="loadTournament(t.id)"
            :disabled="loadingId === t.id"
            class="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 min-h-[44px] transition-colors"
          >
            {{ loadingId === t.id ? 'Loading...' : (isAuthenticated ? 'Load' : 'Open') }}
          </button>
          <button
            v-if="isAuthenticated"
            @click="confirmDelete(t)"
            class="px-4 py-2 rounded-lg font-medium text-red-400 hover:bg-red-900/40 active:bg-red-900/60 min-h-[44px] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-white mb-2">Delete Saved Tournament?</h3>
        <p class="text-gray-400 mb-4">Are you sure you want to delete "{{ deleteTarget.name }}"? This cannot be undone.</p>
        <div class="flex gap-3 justify-end">
          <button
            @click="deleteTarget = null"
            class="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-700 min-h-[44px] transition-colors"
          >
            Cancel
          </button>
          <button
            @click="deleteTournament()"
            :disabled="deleting"
            class="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 min-h-[44px] transition-colors"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { API_BASE } from '../config/api.js';
import { safeJsonParse, handleNetworkError } from '../utils/apiHelpers.js';
import { useAuth } from '../composables/useAuth.js';

const { isAuthenticated } = useAuth();

const emit = defineEmits(['load-tournament']);

const tournaments = ref([]);
const loading = ref(true);
const error = ref('');
const loadingId = ref(null);
const deleteTarget = ref(null);
const deleting = ref(false);

const typeLabel = (type) => {
  const labels = {
    swiss: 'Swiss',
    swiss_uscf: 'Swiss (USCF)',
    swiss_fide_dutch: 'Swiss (FIDE Dutch)',
    swiss_accelerated: 'Swiss (Accelerated)',
    round_robin: 'Round Robin',
    double_round_robin: 'Double Round Robin',
  };
  return labels[type] || type;
};

const statusLabel = (status) => {
  if (status === 'registration') return 'Registration';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  return status;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fetchTournaments = async () => {
  loading.value = true;
  error.value = '';
  try {
    if (isAuthenticated.value) {
      const url = `${API_BASE}/saved-tournaments`;
      const response = await fetch(url, { credentials: 'include' }).catch((e) => {
        throw handleNetworkError(e, url);
      });
      const data = await safeJsonParse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to load saved tournaments');
      tournaments.value = data.savedTournaments;
    } else {
      const url = `${API_BASE}/tournaments`;
      const response = await fetch(url, { credentials: 'include' }).catch((e) => {
        throw handleNetworkError(e, url);
      });
      const data = await safeJsonParse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to load tournaments');
      // Normalize in-memory tournament fields to match saved tournament format
      tournaments.value = (data.tournaments || []).map((t) => ({
        id: t.id,
        name: t.name,
        tournament_type: t.tournamentType,
        status: t.status,
        player_count: t.playerCount,
        current_round: t.currentRound,
        number_of_rounds: t.numberOfRounds,
        updated_at: t.createdAt,
      }));
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadTournament = async (id) => {
  loadingId.value = id;
  try {
    if (!isAuthenticated.value) {
      // In-memory tournament — already loaded on the server, just navigate
      emit('load-tournament', { tournamentId: id, savedId: null });
      return;
    }

    // Fetch full saved tournament data
    const detailUrl = `${API_BASE}/saved-tournaments/${id}`;
    const detailRes = await fetch(detailUrl, { credentials: 'include' }).catch((e) => {
      throw handleNetworkError(e, detailUrl);
    });
    const detailData = await safeJsonParse(detailRes);
    if (!detailRes.ok) throw new Error(detailData.error || 'Failed to load tournament');

    // Load into in-memory tournament system
    const loadUrl = `${API_BASE}/tournaments/load`;
    const loadRes = await fetch(loadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tournamentData: detailData.savedTournament.tournament_data,
        savedId: id,
      }),
    }).catch((e) => {
      throw handleNetworkError(e, loadUrl);
    });
    const loadData = await safeJsonParse(loadRes);
    if (!loadRes.ok) throw new Error(loadData.error || 'Failed to load tournament into memory');

    emit('load-tournament', { tournamentId: loadData.tournament.id, savedId: id });
  } catch (err) {
    error.value = err.message;
  } finally {
    loadingId.value = null;
  }
};

const confirmDelete = (t) => {
  deleteTarget.value = t;
};

const deleteTournament = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    const url = `${API_BASE}/saved-tournaments/${deleteTarget.value.id}`;
    const response = await fetch(url, { method: 'DELETE', credentials: 'include' }).catch((e) => {
      throw handleNetworkError(e, url);
    });
    const data = await safeJsonParse(response);
    if (!response.ok) throw new Error(data.error || 'Failed to delete');
    tournaments.value = tournaments.value.filter((t) => t.id !== deleteTarget.value.id);
    deleteTarget.value = null;
  } catch (err) {
    error.value = err.message;
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchTournaments);
</script>
