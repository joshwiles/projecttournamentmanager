<template>
  <div class="player-manager bg-white rounded-lg shadow-md p-4 md:p-6">
    <h2 class="text-xl md:text-2xl font-bold mb-4">Players ({{ players.length }})</h2>

    <div v-if="tournamentStatus === 'registration'" class="mb-4">
      <form @submit.prevent="addPlayer" class="space-y-3">
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="newPlayerName"
            type="text"
            required
            class="flex-1 px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
            placeholder="Enter player name"
          />
          <input
            v-model.number="newPlayerRating"
            type="number"
            min="0"
            max="3000"
            class="w-full sm:w-32 px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
            placeholder="Rating (optional)"
          />
          <button
            type="submit"
            :disabled="loading"
            class="w-full sm:w-auto bg-green-600 text-white py-3 md:py-2 px-4 rounded-md active:bg-green-700 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold min-h-[44px] text-base"
          >
            Add Player
          </button>
        </div>
        <p class="text-sm md:text-xs text-gray-500">Leave rating blank for unrated players</p>
      </form>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>

    <div v-if="players.length === 0" class="text-gray-500 text-center py-8">
      No players added yet
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="player in players"
        :key="player.id"
        class="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-md active:bg-gray-100 hover:bg-gray-100 transition-colors"
      >
        <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <span class="font-medium text-base md:text-lg truncate">{{ player.name }}</span>
          <span v-if="player.rating" class="text-sm md:text-base text-gray-600 flex-shrink-0">
            ({{ player.rating }})
          </span>
          <span v-else class="text-xs md:text-sm text-gray-400 italic flex-shrink-0">(unrated)</span>
        </div>
        <button
          v-if="tournamentStatus === 'registration'"
          @click="removePlayer(player.id)"
          class="text-red-600 active:text-red-800 hover:text-red-800 font-medium px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          Remove
        </button>
      </li>
    </ul>

    <div v-if="tournamentStatus === 'registration' && players.length >= 2" class="mt-6">
      <button
        @click="startTournament"
        :disabled="loading || players.length < 2"
        class="w-full bg-purple-600 text-white py-3 md:py-2 px-4 rounded-md active:bg-purple-700 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold min-h-[44px] text-base"
      >
        Start Tournament
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { API_BASE } from '../config/api.js';

const props = defineProps({
  tournamentId: {
    type: Number,
    required: true,
  },
  players: {
    type: Array,
    default: () => [],
  },
  tournamentStatus: {
    type: String,
    default: 'registration',
  },
});

const emit = defineEmits(['player-added', 'player-removed', 'tournament-started']);

const newPlayerName = ref('');
const newPlayerRating = ref('');
const loading = ref(false);
const error = ref('');

const addPlayer = async () => {
  if (!newPlayerName.value.trim()) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`${API_BASE}/tournaments/${props.tournamentId}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newPlayerName.value.trim(),
        rating: newPlayerRating.value ? parseInt(newPlayerRating.value) : null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add player');
    }

    emit('player-added', data.player);
    newPlayerName.value = '';
    newPlayerRating.value = '';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const removePlayer = async (playerId) => {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`${API_BASE}/tournaments/${props.tournamentId}/players/${playerId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove player');
    }

    emit('player-removed', playerId);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const startTournament = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`${API_BASE}/tournaments/${props.tournamentId}/start`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start tournament');
    }

    emit('tournament-started', data.tournament);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

