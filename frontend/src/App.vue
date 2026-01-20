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
  mobileMenuOpen.value = false;
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
  mobileMenuOpen.value = false;
};

const showCreator = ref(false);
const selectedTournamentType = ref('swiss_uscf');
const mobileMenuOpen = ref(false);

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
  mobileMenuOpen.value = false;
};

const handleCloseSignIn = () => {
  showSignIn.value = false;
  currentView.value = 'dashboard';
  mobileMenuOpen.value = false;
};

const handleSignedIn = (user) => {
  currentUser.value = user;
  showSignIn.value = false;
  currentView.value = 'dashboard';
  mobileMenuOpen.value = false;
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
      <div class="container mx-auto px-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center py-3 md:py-4">
          <div class="flex-1 min-w-0">
            <h1 
              @click="handleNavigateToDashboard"
              class="text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer active:opacity-80 transition-opacity truncate"
            >
              ♟️ Chess Tournament Manager
            </h1>
            <p class="text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1 font-medium hidden sm:block">Free chess tournament organizer</p>
          </div>
          
          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-300 active:bg-gray-700/60 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex gap-2">
            <button
              @click="currentView = 'list'; selectedTournamentId = null; showCreator = false; mobileMenuOpen = false"
              :class="[
                'px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 min-h-[44px]',
                currentView === 'list'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-300 hover:bg-gray-700/60 hover:shadow-md active:bg-gray-700/60'
              ]"
            >
              Tournaments
            </button>
            <button
              v-if="!currentUser"
              @click="handleOpenSignIn"
              class="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 text-gray-300 hover:bg-gray-700/60 hover:shadow-md active:bg-gray-700/60 min-h-[44px]"
            >
              Sign In
            </button>
            <div
              v-else
              class="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold text-gray-300 flex items-center gap-2 min-h-[44px]"
            >
              <span class="hidden lg:inline">{{ currentUser.name }}</span>
              <span class="lg:hidden">{{ currentUser.name.split(' ')[0] }}</span>
              <button
                @click="currentUser = null"
                class="text-gray-400 active:text-gray-200 transition-colors text-sm min-h-[44px] px-2"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>

        <!-- Mobile Menu -->
        <div
          v-if="mobileMenuOpen"
          class="md:hidden border-t border-gray-700/50 py-3 space-y-2"
        >
          <button
            @click="currentView = 'list'; selectedTournamentId = null; showCreator = false; mobileMenuOpen = false"
            :class="[
              'w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left min-h-[44px]',
              currentView === 'list'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-300 active:bg-gray-700/60'
            ]"
          >
            Tournaments
          </button>
          <button
            v-if="!currentUser"
            @click="handleOpenSignIn; mobileMenuOpen = false"
            class="w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left text-gray-300 active:bg-gray-700/60 min-h-[44px]"
          >
            Sign In
          </button>
          <div
            v-else
            class="px-4 py-3 rounded-xl text-gray-300 space-y-2"
          >
            <div class="font-semibold">{{ currentUser.name }}</div>
            <button
              @click="currentUser = null; mobileMenuOpen = false"
              class="w-full text-left text-gray-400 active:text-gray-200 transition-colors text-sm min-h-[44px] px-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
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
    <footer class="backdrop-blur-xl bg-gray-800/60 border-t border-gray-700/50 py-4 md:py-6 mt-auto">
      <div class="container mx-auto px-4 flex justify-center">
        <p class="text-xs md:text-sm text-gray-400 font-medium">
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
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Mobile-first: base styles for small screens */
@media (min-width: 481px) {
  .container {
    padding: 0 1rem;
  }
}
</style>
