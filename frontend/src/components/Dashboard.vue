<template>
  <div class="dashboard flex items-center justify-center min-h-[60vh]">
    <div class="w-full max-w-xl animate-fade-in">
      <!-- Welcome Card -->
      <div class="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-gray-700/50">
        <!-- Welcome Message -->
        <div class="text-center mb-10">
          <h1 class="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome
          </h1>
          <p class="text-xl md:text-2xl text-gray-300 font-medium">
            to Pawn Up Solutions' Free Tournament Manager
          </p>
        </div>

        <!-- Tournament Style Selection -->
        <div class="space-y-6">
          <!-- Tournament Style Dropdown -->
          <div>
            <label for="tournament-style" class="block text-sm font-semibold text-gray-300 mb-3">
              Select Tournament Style
            </label>
            <select
              id="tournament-style"
              v-model="tournamentType"
              class="w-full px-5 py-4 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-700/50 text-gray-100 appearance-none cursor-pointer hover:bg-gray-700/70"
            >
              <option value="swiss_uscf" class="bg-gray-800">Swiss (USCF)</option>
              <option value="swiss_fide_dutch" class="bg-gray-800">Swiss (FIDE Dutch)</option>
              <option value="swiss_accelerated" class="bg-gray-800">Swiss (Accelerated)</option>
              <option value="round_robin" class="bg-gray-800">Round Robin</option>
              <option value="double_round_robin" class="bg-gray-800">Double Round Robin</option>
            </select>
          </div>

          <!-- Info for Round Robin types -->
          <div v-if="tournamentType === 'round_robin' || tournamentType === 'double_round_robin'" class="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/50 rounded-xl p-4">
            <p class="text-sm text-gray-300">
              <span class="font-semibold text-indigo-400">
                {{ tournamentType === 'round_robin' ? 'Round Robin' : 'Double Round Robin' }}:
              </span>
              <span class="text-gray-400">
                {{ tournamentType === 'round_robin' 
                  ? 'Each player plays every other player once. Rounds will be calculated automatically based on number of players.'
                  : 'Each player plays every other player twice (once with each color). Rounds will be calculated automatically based on number of players.' }}
              </span>
            </p>
          </div>

          <!-- Start Tournament Button -->
          <button
            @click="handleStartTournament"
            class="w-full group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-105 transform"
          >
            <span class="flex items-center justify-center gap-3">
              <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Start Tournament
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['start-tournament']);

const tournamentType = ref('swiss_uscf');

const handleStartTournament = () => {
  emit('start-tournament', tournamentType.value);
};
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

/* Custom select arrow */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a5b4fc'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.5em 1.5em;
  padding-right: 3rem;
}
</style>
