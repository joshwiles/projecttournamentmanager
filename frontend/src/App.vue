<script setup>
import { ref, onMounted, computed } from 'vue';
import Dashboard from './components/Dashboard.vue';
import TournamentList from './components/TournamentList.vue';
import TournamentView from './components/TournamentView.vue';
import TournamentCreator from './components/TournamentCreator.vue';
import SignIn from './components/SignIn.vue';
import ForgotPassword from './components/ForgotPassword.vue';
import ResetPassword from './components/ResetPassword.vue';
import MyTournaments from './components/MyTournaments.vue';
import ProfileDropdown from './components/ProfileDropdown.vue';
import Account from './components/Account.vue';
import Settings from './components/Settings.vue';
import { useAuth } from './composables/useAuth.js';
import { useTheme } from './composables/useTheme.js';

const { user, initialCheckDone, loadUser, logout: authLogout, isAuthenticated } = useAuth();
const { tc, syncFromUser } = useTheme();

const currentView = ref('dashboard'); // 'dashboard', 'list', 'tournament', 'signin', 'forgot-password', 'reset-password', 'my-tournaments', 'account', 'settings'
const selectedTournamentId = ref(null);
const selectedSavedId = ref(null);
const showSignIn = ref(false);
const resetToken = ref(null);

// Computed property for current user
const currentUser = computed(() => user.value);

const handleTournamentSelected = (tournamentId) => {
  selectedTournamentId.value = tournamentId;
  selectedSavedId.value = null;
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

const previousView = ref(null);

const handleOpenSignIn = () => {
  mobileMenuOpen.value = false;
  // If a tournament is active, show sign-in as overlay without navigating away
  if (currentView.value === 'tournament' && selectedTournamentId.value) {
    previousView.value = 'tournament';
    showSignIn.value = true;
  } else {
    previousView.value = currentView.value;
    showSignIn.value = true;
    currentView.value = 'signin';
  }
};

const handleCloseSignIn = () => {
  showSignIn.value = false;
  if (previousView.value === 'tournament' && selectedTournamentId.value) {
    // Already on tournament view, just close the overlay
    previousView.value = null;
  } else {
    currentView.value = previousView.value || 'dashboard';
    previousView.value = null;
  }
  mobileMenuOpen.value = false;
};

const handleSignedIn = async (signedInUser) => {
  await loadUser();
  syncFromUser(user.value);
  showSignIn.value = false;
  if (previousView.value === 'tournament' && selectedTournamentId.value) {
    // Stay on the tournament view
    previousView.value = null;
  } else {
    currentView.value = 'dashboard';
    previousView.value = null;
  }
  mobileMenuOpen.value = false;
};

const handleLogout = async () => {
  await authLogout();
  currentView.value = 'dashboard';
  mobileMenuOpen.value = false;
};

const handleProfileNavigate = (view) => {
  currentView.value = view;
  selectedTournamentId.value = null;
  showCreator.value = false;
  mobileMenuOpen.value = false;
};

const handleOpenAccount = () => {
  currentView.value = 'account';
  mobileMenuOpen.value = false;
};

const handleOpenSettings = () => {
  currentView.value = 'settings';
  mobileMenuOpen.value = false;
};

const handleOpenMyTournaments = () => {
  currentView.value = 'my-tournaments';
  selectedTournamentId.value = null;
  showCreator.value = false;
  mobileMenuOpen.value = false;
};

const handleForgotPassword = () => {
  showSignIn.value = false;
  currentView.value = 'forgot-password';
};

const handleForgotPasswordBack = () => {
  handleOpenSignIn();
};

const handleResetPasswordGoToSignIn = () => {
  resetToken.value = null;
  // Clean the URL
  window.history.replaceState({}, '', window.location.pathname);
  handleOpenSignIn();
};

const handleLoadSavedTournament = ({ tournamentId, savedId }) => {
  selectedTournamentId.value = tournamentId;
  selectedSavedId.value = savedId;
  currentView.value = 'tournament';
};

// Load user on app start, check for reset token in URL, apply theme
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('reset-token');
  if (token) {
    resetToken.value = token;
    currentView.value = 'reset-password';
  }

  await loadUser();
  syncFromUser(user.value);
});
</script>

<template>
  <div id="app" :class="['flex flex-col min-h-screen bg-gradient-to-br', tc.bodyGradient]">
    <!-- Header -->
    <header class="backdrop-blur-xl bg-gray-800/80 border-b border-gray-700/50 shadow-lg sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center py-3 md:py-4">
          <div class="flex-1 min-w-0">
            <h1 
              @click="handleNavigateToDashboard"
              :class="['text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent cursor-pointer active:opacity-80 transition-opacity truncate', tc.titleGradient]"
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
              v-if="currentUser"
              @click="handleOpenMyTournaments()"
              :class="[
                'px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 min-h-[44px]',
                currentView === 'my-tournaments'
                  ? `bg-gradient-to-r ${tc.navActive} text-white shadow-md ${tc.navActiveShadow}`
                  : 'text-gray-300 hover:bg-gray-700/60 hover:shadow-md active:bg-gray-700/60'
              ]"
            >
              My Tournaments
            </button>
            <button
              v-if="!currentUser"
              @click="handleOpenSignIn"
              class="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 text-gray-300 hover:bg-gray-700/60 hover:shadow-md active:bg-gray-700/60 min-h-[44px]"
            >
              Sign In
            </button>
            <ProfileDropdown
              v-else
              @navigate="handleProfileNavigate"
              @sign-out="handleLogout"
            />
          </nav>
        </div>

        <!-- Mobile Menu -->
        <div
          v-if="mobileMenuOpen"
          class="md:hidden border-t border-gray-700/50 py-3 space-y-2"
        >
          <template v-if="currentUser">
            <button
              @click="handleOpenMyTournaments()"
              :class="[
                'w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left min-h-[44px]',
                currentView === 'my-tournaments'
                  ? `bg-gradient-to-r ${tc.navActive} text-white shadow-md`
                  : 'text-gray-300 active:bg-gray-700/60'
              ]"
            >
              My Tournaments
            </button>
            <button
              @click="handleOpenAccount()"
              :class="[
                'w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left min-h-[44px]',
                currentView === 'account'
                  ? `bg-gradient-to-r ${tc.navActive} text-white shadow-md`
                  : 'text-gray-300 active:bg-gray-700/60'
              ]"
            >
              Account
            </button>
            <button
              @click="handleOpenSettings()"
              :class="[
                'w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left min-h-[44px]',
                currentView === 'settings'
                  ? `bg-gradient-to-r ${tc.navActive} text-white shadow-md`
                  : 'text-gray-300 active:bg-gray-700/60'
              ]"
            >
              Settings
            </button>
            <button
              @click="handleLogout"
              class="w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left text-gray-400 active:bg-gray-700/60 min-h-[44px]"
            >
              Sign Out
            </button>
          </template>
          <button
            v-else
            @click="handleOpenSignIn()"
            class="w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left text-gray-300 active:bg-gray-700/60 min-h-[44px]"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <!-- Show loading spinner while initial auth check runs -->
      <div v-if="!initialCheckDone" class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div :class="['inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4', tc.spinner]"></div>
          <p class="text-gray-400">Loading...</p>
        </div>
      </div>
      
      <!-- Content when auth check is complete -->
      <template v-else>
        <SignIn
          v-if="currentView === 'signin'"
          @close="handleCloseSignIn"
          @signed-in="handleSignedIn"
          @forgot-password="handleForgotPassword"
        />
        <ForgotPassword
          v-else-if="currentView === 'forgot-password'"
          @back="handleForgotPasswordBack"
        />
        <ResetPassword
          v-else-if="currentView === 'reset-password' && resetToken"
          :token="resetToken"
          @go-to-signin="handleResetPasswordGoToSignIn"
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
        <Account
          v-else-if="currentView === 'account'"
          @back="handleNavigateToDashboard"
        />
        <Settings
          v-else-if="currentView === 'settings'"
          @back="handleNavigateToDashboard"
        />
        <MyTournaments
          v-else-if="currentView === 'my-tournaments'"
          @load-tournament="handleLoadSavedTournament"
        />
        <TournamentView
          v-else-if="currentView === 'tournament' && selectedTournamentId"
          :tournament-id="selectedTournamentId"
          :initial-saved-id="selectedSavedId"
          @close-tournament="handleCloseTournament"
        />
      </template>
    </main>

    <!-- Sign In Modal Overlay (when tournament is active) -->
    <div v-if="showSignIn && currentView === 'tournament'" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="w-full max-w-md">
        <SignIn
          @close="handleCloseSignIn"
          @signed-in="handleSignedIn"
          @forgot-password="handleForgotPassword"
        />
      </div>
    </div>

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
