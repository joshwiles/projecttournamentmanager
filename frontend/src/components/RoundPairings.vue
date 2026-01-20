<template>
  <div class="round-pairings bg-white rounded-lg shadow-md p-4 md:p-6">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
      <h2 class="text-xl md:text-2xl font-bold">Round {{ round?.roundNumber || currentRound }}</h2>
      <div v-if="round && !round.completed" class="text-sm md:text-base text-gray-600">
        {{ completedPairings }}/{{ totalPairings }} results entered
      </div>
      <div v-else-if="round?.completed" class="text-sm md:text-base text-green-600 font-medium">
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
        class="border border-gray-200 rounded-lg p-4 active:bg-gray-50 hover:bg-gray-50 transition-colors"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="text-sm md:text-base text-gray-600 mb-3 font-medium">Board {{ pairing.boardNumber }}</div>
            
            <div v-if="pairing.isBye" class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="font-medium text-base">{{ pairing.player1.name }}</span>
                <span class="text-green-600 font-semibold text-sm md:text-base">BYE (1 point)</span>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div class="flex items-center gap-2 md:gap-3 flex-wrap">
                <span
                  class="w-3 h-3 md:w-2 md:h-2 rounded-full flex-shrink-0"
                  :class="pairing.whitePlayerId === pairing.player1.id ? 'bg-white border-2 border-gray-400' : 'bg-black'"
                ></span>
                <span class="font-medium text-base md:text-lg break-words">{{ pairing.player1.name }}</span>
                <span v-if="pairing.player1.rating" class="text-xs md:text-sm text-gray-500">
                  ({{ pairing.player1.rating }})
                </span>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                  {{ pairing.whitePlayerId === pairing.player1.id ? 'White' : 'Black' }}
                </span>
              </div>
              <div class="text-center text-gray-400 text-sm md:text-base">vs</div>
              <div class="flex items-center gap-2 md:gap-3 flex-wrap">
                <span
                  class="w-3 h-3 md:w-2 md:h-2 rounded-full flex-shrink-0"
                  :class="pairing.whitePlayerId === pairing.player2.id ? 'bg-white border-2 border-gray-400' : 'bg-black'"
                ></span>
                <span class="font-medium text-base md:text-lg break-words">{{ pairing.player2.name }}</span>
                <span v-if="pairing.player2.rating" class="text-xs md:text-sm text-gray-500">
                  ({{ pairing.player2.rating }})
                </span>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                  {{ pairing.whitePlayerId === pairing.player2.id ? 'White' : 'Black' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!pairing.isBye && !round.completed" class="sm:ml-4 w-full sm:w-auto">
            <select
              v-model="pairing.result"
              @change="updateResult(pairing, index)"
              class="w-full sm:w-auto px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] bg-white"
            >
              <option value="">Select result</option>
              <option value="1-0">White wins (1-0)</option>
              <option value="0-1">Black wins (0-1)</option>
              <option value="1/2-1/2">Draw (½-½)</option>
            </select>
          </div>

          <div v-else-if="!pairing.isBye && round.completed" class="sm:ml-4 w-full sm:w-auto">
            <span class="inline-block w-full sm:w-auto px-4 py-3 md:py-2 bg-gray-100 rounded-md font-medium text-center text-base">
              {{ formatResult(pairing.result) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="!round.completed && completedPairings === totalPairings" class="mt-6">
        <button
          @click="completeRound"
          :disabled="loading"
          class="w-full bg-green-600 text-white py-3 md:py-2 px-4 rounded-md active:bg-green-700 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold min-h-[44px] text-base"
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
import { safeJsonParse, handleNetworkError } from '../utils/apiHelpers.js';

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
    const url = `${API_BASE}/tournaments/${props.tournamentId}/rounds/${props.round.roundNumber}/pairings/${pairingIndex}/result`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        result: pairing.result,
      }),
    }).catch((fetchError) => {
      throw handleNetworkError(fetchError, url);
    });

    const data = await safeJsonParse(response);

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
    const url = `${API_BASE}/tournaments/${props.tournamentId}/rounds/${props.round.roundNumber}/complete`;
    const response = await fetch(url, {
      method: 'POST',
    }).catch((fetchError) => {
      throw handleNetworkError(fetchError, url);
    });

    const data = await safeJsonParse(response);

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

