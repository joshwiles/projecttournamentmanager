<template>
  <div class="tournament-creator bg-white rounded-lg shadow-md p-4 md:p-6">
    <h2 class="text-xl md:text-2xl font-bold mb-4">Create New Tournament</h2>
    
    <form @submit.prevent="createTournament" class="space-y-4">
      <div>
        <label for="tournament-name" class="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Tournament Name
        </label>
        <input
          id="tournament-name"
          v-model="tournamentName"
          type="text"
          required
          class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
          placeholder="Enter tournament name"
        />
      </div>

      <div>
        <label for="tournament-type" class="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Tournament Type
        </label>
        <select
          id="tournament-type"
          v-model="tournamentType"
          @change="updateRoundsBasedOnType"
          class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] bg-white"
        >
          <option value="swiss_uscf">Swiss (USCF)</option>
          <option value="swiss_fide_dutch">Swiss (FIDE Dutch)</option>
          <option value="swiss_accelerated">Swiss (Accelerated)</option>
          <option value="round_robin">Round Robin</option>
          <option value="double_round_robin">Double Round Robin</option>
        </select>
      </div>

      <div v-if="isSwiss">
        <label for="number-of-rounds" class="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Number of Rounds
        </label>
        <input
          id="number-of-rounds"
          v-model.number="numberOfRounds"
          type="number"
          min="1"
          max="20"
          required
          class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px]"
        />
      </div>

      <div v-else class="text-sm md:text-base text-gray-600 bg-gray-50 p-3 md:p-4 rounded">
        <p v-if="tournamentType === 'round_robin'">
          Round Robin: Each player plays every other player once.
          <span class="font-semibold">Rounds will be calculated automatically based on number of players.</span>
        </p>
        <p v-else-if="tournamentType === 'double_round_robin'">
          Double Round Robin: Each player plays every other player twice (once with each color).
          <span class="font-semibold">Rounds will be calculated automatically based on number of players.</span>
        </p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-3 md:py-2 px-4 rounded-md active:bg-blue-700 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold min-h-[44px] text-base"
      >
        {{ loading ? 'Creating...' : 'Create Tournament' }}
      </button>
    </form>

    <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { API_BASE } from '../config/api.js';

const emit = defineEmits(['tournament-created']);

const tournamentName = ref('');
const tournamentType = ref('swiss_fide_dutch');
const numberOfRounds = ref(5);
const loading = ref(false);
const error = ref('');

const isSwiss = computed(() => tournamentType.value.startsWith('swiss'));

const updateRoundsBasedOnType = () => {
  // Rounds will be calculated automatically for round robin
  if (!isSwiss.value) {
    numberOfRounds.value = 0; // Will be calculated
  } else {
    numberOfRounds.value = 5;
  }
};

const createTournament = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`${API_BASE}/tournaments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: tournamentName.value,
        tournamentType: tournamentType.value,
        numberOfRounds: isSwiss.value ? numberOfRounds.value : 0,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create tournament');
    }

    emit('tournament-created', data.tournament);
    tournamentName.value = '';
    tournamentType.value = 'swiss_fide_dutch';
    numberOfRounds.value = 5;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

