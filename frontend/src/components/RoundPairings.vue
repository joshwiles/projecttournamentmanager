<template>
  <div class="round-pairings bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Round {{ round?.roundNumber || currentRound }}</h2>
      <div v-if="round && !round.completed" class="text-sm text-gray-600">
        {{ completedPairings }}/{{ totalPairings }} results entered
      </div>
      <div v-else-if="round?.completed" class="text-sm text-green-600 font-medium">
        Round Completed
      </div>
    </div>

    <div v-if="!round" class="text-gray-500 text-center py-8">
      No round data available
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(pairing, index) in round.pairings"
        :key="index"
        class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-sm text-gray-600 mb-2">Board {{ pairing.boardNumber }}</div>
            
            <div v-if="pairing.isBye" class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ pairing.player1.name }}</span>
                <span class="text-green-600 font-semibold">BYE (1 point)</span>
              </div>
            </div>

            <div v-else class="space-y-2">
              <div class="flex items-center gap-3">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="pairing.whitePlayerId === pairing.player1.id ? 'bg-white border-2 border-gray-400' : 'bg-black'"
                ></span>
                <span class="font-medium">{{ pairing.player1.name }}</span>
                <span v-if="pairing.player1.rating" class="text-xs text-gray-500">
                  ({{ pairing.player1.rating }})
                </span>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                  {{ pairing.whitePlayerId === pairing.player1.id ? 'White' : 'Black' }}
                </span>
              </div>
              <div class="text-center text-gray-400">vs</div>
              <div class="flex items-center gap-3">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="pairing.whitePlayerId === pairing.player2.id ? 'bg-white border-2 border-gray-400' : 'bg-black'"
                ></span>
                <span class="font-medium">{{ pairing.player2.name }}</span>
                <span v-if="pairing.player2.rating" class="text-xs text-gray-500">
                  ({{ pairing.player2.rating }})
                </span>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                  {{ pairing.whitePlayerId === pairing.player2.id ? 'White' : 'Black' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!pairing.isBye && !round.completed" class="ml-4">
            <select
              v-model="pairing.result"
              @change="updateResult(pairing, index)"
              class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select result</option>
              <option value="1-0">White wins (1-0)</option>
              <option value="0-1">Black wins (0-1)</option>
              <option value="1/2-1/2">Draw (½-½)</option>
            </select>
          </div>

          <div v-else-if="!pairing.isBye && round.completed" class="ml-4">
            <span class="px-3 py-2 bg-gray-100 rounded-md font-medium">
              {{ formatResult(pairing.result) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="!round.completed && completedPairings === totalPairings" class="mt-6">
        <button
          @click="completeRound"
          :disabled="loading"
          class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Completing...' : 'Complete Round' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { API_BASE } from '../config/api.js';

const props = defineProps({
  round: {
    type: Object,
    default: null,
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  tournamentId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['round-completed', 'result-updated']);

const loading = ref(false);
const error = ref('');

const completedPairings = computed(() => {
  if (!props.round) return 0;
  return props.round.pairings.filter(p => p.isBye || p.result).length;
});

const totalPairings = computed(() => {
  if (!props.round) return 0;
  return props.round.pairings.length;
});

const formatResult = (result) => {
  if (!result) return '-';
  if (result === '1-0') return '1-0';
  if (result === '0-1') return '0-1';
  if (result === '1/2-1/2') return '½-½';
  return result;
};

const updateResult = async (pairing, pairingIndex) => {
  if (!pairing.result) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(
      `${API_BASE}/tournaments/${props.tournamentId}/rounds/${props.round.roundNumber}/pairings/${pairingIndex}/result`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: pairing.result,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update result');
    }

    emit('result-updated');
  } catch (err) {
    error.value = err.message;
    pairing.result = ''; // Revert on error
  } finally {
    loading.value = false;
  }
};

const completeRound = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(
      `${API_BASE}/tournaments/${props.tournamentId}/rounds/${props.round.roundNumber}/complete`,
      {
        method: 'POST',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to complete round');
    }

    emit('round-completed', data);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

