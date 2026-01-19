<script setup>
import { ref } from 'vue';
import Dashboard from './components/Dashboard.vue';
import TournamentList from './components/TournamentList.vue';
import TournamentView from './components/TournamentView.vue';
import TournamentCreator from './components/TournamentCreator.vue';
import SignIn from './components/SignIn.vue';

const currentView = ref('dashboard'); // 'dashboard', 'list', 'tournament', 'signin'
const selectedTournamentId = ref(null);
const showSignIn = ref(false);
const currentUser = ref(null);

const handleTournamentSelected = (tournamentId) => {
  selectedTournamentId.value = tournamentId;
  currentView.value = 'tournament';
};

const handleCloseTournament = () => {
  selectedTournamentId.value = null;
  currentView.value = 'dashboard';
};

const handleViewAllTournaments = () => {
  currentView.value = 'list';
};

const handleNavigateToDashboard = () => {
  currentView.value = 'dashboard';
  selectedTournamentId.value = null;
  showCreator.value = false;
};

const showCreator = ref(false);
const selectedTournamentType = ref('swiss_uscf');

const handleStartTournament = (tournamentType) => {
  selectedTournamentType.value = tournamentType;
  showCreator.value = true;
};

const handleTournamentCreated = (tournament) => {
  showCreator.value = false;
  handleTournamentSelected(tournament.id);
};

const handleOpenSignIn = () => {
  showSignIn.value = true;
  currentView.value = 'signin';
};

const handleCloseSignIn = () => {
  showSignIn.value = false;
  currentView.value = 'dashboard';
};

const handleSignedIn = (user) => {
  currentUser.value = user;
  showSignIn.value = false;
  currentView.value = 'dashboard';
};

const handleSignedUp = (user) => {
  // User signed up, they'll be prompted to sign in
  currentUser.value = null;
};
</script>

<template>
  <div id="app" class="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950">
    <!-- Header -->
    <header class="backdrop-blur-xl bg-gray-800/80 border-b border-gray-700/50 shadow-lg sticky top-0 z-50">
      <div class="container mx-auto">
        <div class="flex justify-between items-center py-4">
          <div>
            <h1 
              @click="handleNavigateToDashboard"
              class="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
            >
              ♟️ Chess Tournament Manager
            </h1>
            <p class="text-sm text-gray-400 mt-1 font-medium">Free chess tournament organizer</p>
          </div>
          <nav class="flex gap-2">
            <button
              @click="currentView = 'list'; selectedTournamentId = null; showCreator = false"
              :class="[
                'px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform',
                currentView === 'list'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                  : 'text-gray-300 hover:bg-gray-700/60 hover:shadow-md'
              ]"
            >
              Tournaments
            </button>
            <button
              v-if="!currentUser"
              @click="handleOpenSignIn"
              class="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform text-gray-300 hover:bg-gray-700/60 hover:shadow-md"
            >
              Sign In
            </button>
            <div
              v-else
              class="px-5 py-2.5 rounded-xl font-semibold text-gray-300 flex items-center gap-2"
            >
              <span>{{ currentUser.name }}</span>
              <button
                @click="currentUser = null"
                class="text-gray-400 hover:text-gray-200 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto p-4 md:p-8">
      <SignIn
        v-if="currentView === 'signin'"
        @close="handleCloseSignIn"
        @signed-in="handleSignedIn"
        @signed-up="handleSignedUp"
      />
      <Dashboard
        v-else-if="currentView === 'dashboard' && !showCreator"
        @start-tournament="handleStartTournament"
      />
      <TournamentCreator
        v-else-if="currentView === 'dashboard' && showCreator"
        :initial-tournament-type="selectedTournamentType"
        @tournament-created="handleTournamentCreated"
        @cancel="showCreator = false"
      />
      <TournamentList
        v-else-if="currentView === 'list' && !selectedTournamentId"
        @tournament-selected="handleTournamentSelected"
      />
      <TournamentView
        v-else-if="currentView === 'tournament' && selectedTournamentId"
        :tournament-id="selectedTournamentId"
        @close-tournament="handleCloseTournament"
      />
    </main>

    <!-- Footer -->
    <footer class="backdrop-blur-xl bg-gray-800/60 border-t border-gray-700/50 py-6 mt-auto">
      <div class="container mx-auto text-center">
        <p class="text-sm text-gray-400 font-medium">
          &copy; 2025 Pawn Up Solutions
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
