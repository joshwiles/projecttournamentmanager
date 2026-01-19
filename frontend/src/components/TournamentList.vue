<template>
  <div class="tournament-list">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
      </h1>
      <button
        @click="showCreator = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
      {{ error }}
    </div>

    <div v-else-if="tournaments.length === 0" class="bg-white rounded-lg shadow-md p-8 text-center">
      <p class="text-gray-500 mb-4">No tournaments yet. Create your first tournament to get started!</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="tournament in tournaments"
        :key="tournament.id"
        @click="selectTournament(tournament.id)"
        class="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      >
        <h3 class="text-xl font-bold mb-2">{{ tournament.name }}</h3>
        <div class="text-sm text-gray-600 space-y-1">
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TournamentCreator from './TournamentCreator.vue';
import { API_BASE } from '../config/api.js';

const emit = defineEmits(['tournament-selected']);

const tournaments = ref([]);
const loading = ref(true);
const error = ref('');
const showCreator = ref(false);

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
    const response = await fetch(`${API_BASE}/tournaments`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load tournaments');
    }

    tournaments.value = data.tournaments || [];
  } catch (err) {
    error.value = err.message;
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

onMounted(() => {
  loadTournaments();
});
</script>
