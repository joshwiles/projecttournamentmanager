<template>
  <div class="standings bg-white rounded-lg shadow-md p-4 md:p-6">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
      <h2 class="text-xl md:text-2xl font-bold">Standings</h2>
      <button
        v-if="tournament && (tournament.status === 'in_progress' || tournament.status === 'completed')"
        @click="showGameHistory = !showGameHistory"
        class="w-full sm:w-auto text-sm text-blue-600 active:text-blue-800 hover:text-blue-800 font-medium px-4 py-2 rounded-md active:bg-blue-50 min-h-[44px]"
      >
        {{ showGameHistory ? 'Hide' : 'Show' }} Game History
      </button>
    </div>

    <div v-if="standings.length === 0" class="text-gray-500 text-center py-8 text-base">
      No standings available yet
    </div>

    <!-- Mobile Card Layout -->
    <div v-else class="block md:hidden space-y-3">
      <div
        v-for="player in standings"
        :key="player.id"
        class="bg-gray-50 rounded-lg p-4 border-2"
        :class="{
          'border-yellow-400 bg-yellow-50': player.rank === 1,
          'border-gray-300 bg-gray-50': player.rank === 2,
          'border-orange-300 bg-orange-50': player.rank === 3,
          'border-gray-200': player.rank > 3,
        }"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-base"
              :class="{
                'bg-yellow-400 text-yellow-900': player.rank === 1,
                'bg-gray-300 text-gray-900': player.rank === 2,
                'bg-orange-300 text-orange-900': player.rank === 3,
                'bg-gray-200 text-gray-700': player.rank > 3,
              }"
            >
              {{ player.rank }}
            </span>
            <div>
              <div class="font-bold text-base text-gray-900">{{ player.name }}</div>
              <div class="text-sm text-gray-600">
                <span v-if="player.rating">{{ player.rating }}</span>
                <span v-else class="text-gray-400 italic">unrated</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-xl text-gray-900">{{ player.score }}</div>
            <div class="text-xs text-gray-500">points</div>
          </div>
        </div>
        
        <div class="grid grid-cols-4 gap-2 text-center pt-3 border-t border-gray-200">
          <div>
            <div class="text-xs text-gray-500 mb-1">W</div>
            <div class="font-semibold text-base">{{ player.wins }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">D</div>
            <div class="font-semibold text-base">{{ player.draws }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">L</div>
            <div class="font-semibold text-base">{{ player.losses }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">Games</div>
            <div class="font-semibold text-base">{{ player.gamesPlayed }}</div>
          </div>
        </div>

        <!-- Game History (Mobile) -->
        <div
          v-if="showGameHistory && tournament && getPlayerGames(player.id).length > 0"
          class="mt-3 pt-3 border-t border-gray-200"
        >
          <div class="text-xs font-semibold mb-2 text-gray-700">Game History:</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(game, index) in getPlayerGames(player.id)"
              :key="index"
              class="px-2 py-1 rounded text-xs"
              :class="getGameResultClass(game, player.id)"
            >
              R{{ game.round }}: {{ getGameOpponent(game, player.id) }}
              <span class="font-semibold">{{ getGameResult(game, player.id) }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table Layout -->
    <div v-else class="hidden md:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rating
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              W
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              D
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              L
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Games
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="player in standings"
            :key="player.id"
            class="hover:bg-gray-50 transition-colors"
            :class="{
              'bg-yellow-50': player.rank === 1,
              'bg-gray-50': player.rank === 2,
              'bg-orange-50': player.rank === 3,
            }"
          >
            <td class="px-4 py-3 whitespace-nowrap">
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold"
                :class="{
                  'bg-yellow-400 text-yellow-900': player.rank === 1,
                  'bg-gray-300 text-gray-900': player.rank === 2,
                  'bg-orange-300 text-orange-900': player.rank === 3,
                  'bg-gray-200 text-gray-700': player.rank > 3,
                }"
              >
                {{ player.rank }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
              {{ player.name }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center text-gray-600">
              <span v-if="player.rating">{{ player.rating }}</span>
              <span v-else class="text-gray-400 italic text-xs">unrated</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center font-bold text-lg">
              {{ player.score }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center text-gray-600">
              {{ player.wins }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center text-gray-600">
              {{ player.draws }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center text-gray-600">
              {{ player.losses }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center text-gray-600">
              {{ player.gamesPlayed }}
            </td>
          </tr>
          <!-- Game History Row (Desktop) -->
          <tr
            v-if="showGameHistory && tournament && getPlayerGames(player.id).length > 0"
            :key="`history-${player.id}`"
            class="bg-gray-50"
          >
            <td colspan="8" class="px-4 py-3">
              <div class="text-sm">
                <div class="font-semibold mb-2 text-gray-700">Game History:</div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(game, index) in getPlayerGames(player.id)"
                    :key="index"
                    class="px-2 py-1 rounded text-xs"
                    :class="getGameResultClass(game, player.id)"
                  >
                    R{{ game.round }}: {{ getGameOpponent(game, player.id) }}
                    <span class="font-semibold">{{ getGameResult(game, player.id) }}</span>
                  </span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  standings: {
    type: Array,
    default: () => [],
  },
  tournament: {
    type: Object,
    default: null,
  },
});

const showGameHistory = ref(false);

const getPlayerGames = (playerId) => {
  if (!props.tournament || !props.tournament.rounds) return [];
  
  const games = [];
  for (const round of props.tournament.rounds) {
    if (!round.completed) continue;
    
    for (const pairing of round.pairings || []) {
      if (pairing.isBye && pairing.player1.id === playerId) {
        games.push({
          round: round.roundNumber,
          pairing,
          isBye: true,
        });
      } else if (!pairing.isBye && (pairing.player1.id === playerId || pairing.player2.id === playerId)) {
        games.push({
          round: round.roundNumber,
          pairing,
          isBye: false,
        });
      }
    }
  }
  
  return games.sort((a, b) => a.round - b.round);
};

const getGameOpponent = (game, playerId) => {
  if (game.isBye) return 'BYE';
  const opponent = game.pairing.player1.id === playerId 
    ? game.pairing.player2 
    : game.pairing.player1;
  return opponent.name;
};

const getGameResult = (game, playerId) => {
  if (game.isBye) return '1-0';
  if (!game.pairing.result) return '-';
  
  const isWhite = game.pairing.whitePlayerId === playerId;
  if (game.pairing.result === '1-0') {
    return isWhite ? '1-0' : '0-1';
  } else if (game.pairing.result === '0-1') {
    return isWhite ? '0-1' : '1-0';
  } else {
    return '½-½';
  }
};

const getGameResultClass = (game, playerId) => {
  const result = getGameResult(game, playerId);
  if (result === '1-0') return 'bg-green-100 text-green-800';
  if (result === '0-1') return 'bg-red-100 text-red-800';
  if (result === '½-½') return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-600';
};
</script>

