<template>
  <div class="game-results bg-white rounded-lg shadow-md p-4 md:p-6">
    <h2 class="text-xl md:text-2xl font-bold mb-4">Game Results</h2>

    <div v-if="!tournament || !tournament.rounds || tournament.rounds.length === 0" class="text-gray-500 text-center py-8">
      No games played yet
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="round in completedRounds"
        :key="round.roundNumber"
        class="border border-gray-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-800">Round {{ round.roundNumber }}</h3>
          <span class="text-sm text-gray-500">{{ getRoundDate(round) }}</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="(pairing, index) in round.pairings"
            :key="index"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-2 bg-gray-50 rounded active:bg-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xs md:text-sm text-gray-500 mb-2 sm:mb-0 sm:inline-block sm:mr-3 sm:w-auto w-full">Board {{ pairing.boardNumber }}</div>
              
              <div v-if="pairing.isBye" class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-base md:text-lg">{{ pairing.player1.name }}</span>
                <span v-if="pairing.player1.rating" class="text-xs md:text-sm text-gray-500">
                  ({{ pairing.player1.rating }})
                </span>
                <span class="text-green-600 font-semibold text-sm md:text-base">BYE</span>
              </div>

              <div v-else class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="w-3 h-3 md:w-2 md:h-2 rounded-full flex-shrink-0"
                    :class="pairing.whitePlayerId === pairing.player1.id ? 'bg-white border-2 border-gray-400' : 'bg-black'"
                  ></span>
                  <span class="font-medium text-base md:text-lg break-words">{{ pairing.player1.name }}</span>
                  <span v-if="pairing.player1.rating" class="text-xs md:text-sm text-gray-500">
                    ({{ pairing.player1.rating }})
                  </span>
                  <span class="text-xs bg-gray-200 px-2 py-0.5 rounded">
                    {{ pairing.whitePlayerId === pairing.player1.id ? 'W' : 'B' }}
                  </span>
                </div>

                <span class="text-gray-400 mx-0 sm:mx-2 text-center sm:text-left text-sm md:text-base">vs</span>

                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="w-3 h-3 md:w-2 md:h-2 rounded-full flex-shrink-0"
                    :class="pairing.whitePlayerId === pairing.player2.id ? 'bg-white border-2 border-gray-400' : 'bg-black'"
                  ></span>
                  <span class="font-medium text-base md:text-lg break-words">{{ pairing.player2.name }}</span>
                  <span v-if="pairing.player2.rating" class="text-xs md:text-sm text-gray-500">
                    ({{ pairing.player2.rating }})
                  </span>
                  <span class="text-xs bg-gray-200 px-2 py-0.5 rounded">
                    {{ pairing.whitePlayerId === pairing.player2.id ? 'W' : 'B' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="sm:ml-4 flex-shrink-0">
              <span
                v-if="pairing.result"
                class="inline-block px-3 py-2 md:py-1 rounded font-medium text-sm md:text-base text-center min-w-[80px]"
                :class="getResultClass(pairing.result)"
              >
                {{ formatResult(pairing.result) }}
              </span>
              <span v-else class="text-gray-400 text-sm md:text-base italic">No result</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="completedRounds.length === 0" class="text-gray-500 text-center py-8">
        No completed rounds yet
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tournament: {
    type: Object,
    default: null,
  },
});

const completedRounds = computed(() => {
  if (!props.tournament || !props.tournament.rounds) return [];
  return props.tournament.rounds
    .filter(r => r.completed)
    .sort((a, b) => a.roundNumber - b.roundNumber);
});

const formatResult = (result) => {
  if (!result) return '-';
  if (result === '1-0') return '1-0';
  if (result === '0-1') return '0-1';
  if (result === '1/2-1/2') return '½-½';
  return result;
};

const getResultClass = (result) => {
  if (result === '1-0') return 'bg-blue-100 text-blue-800';
  if (result === '0-1') return 'bg-red-100 text-red-800';
  if (result === '1/2-1/2') return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-600';
};

const getRoundDate = (round) => {
  // If round has a date, format it; otherwise return empty
  if (round.completedAt) {
    const date = new Date(round.completedAt);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return '';
};
</script>

