<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import Dashboard from './components/Dashboard.vue';
import TournamentList from './components/TournamentList.vue';
import TournamentView from './components/TournamentView.vue';
import TournamentCreator from './components/TournamentCreator.vue';
import SignIn from './components/SignIn.vue';
import Settings from './components/Settings.vue';
import { useAuth } from './composables/useAuth.js';

const { user, loading: authLoading, loadUser, logout: authLogout, isAuthenticated } = useAuth();

const currentView = ref('dashboard'); // 'dashboard', 'list', 'tournament', 'signin', 'settings'
const selectedTournamentId = ref(null);
const showSignIn = ref(false);
const showSettings = ref(false);

// Computed property for current user
const currentUser = computed(() => user.value);

// Watch currentView for debugging
watch(currentView, (newView, oldView) => {
  console.log('🔄 currentView changed:', oldView, '->', newView);
}, { immediate: true });

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
const profileMenuOpen = ref(false);

const handleStartTournament = (tournamentType) => {
  selectedTournamentType.value = tournamentType;
  showCreator.value = true;
};

const handleTournamentCreated = (tournament) => {
  showCreator.value = false;
  handleTournamentSelected(tournament.id);
};

const signInMode = ref('signin'); // 'signin' or 'signup'

const handleOpenSignIn = () => {
  signInMode.value = 'signin';
  showSignIn.value = true;
  currentView.value = 'signin';
  mobileMenuOpen.value = false;
  profileMenuOpen.value = false;
};

const handleOpenSignUp = () => {
  signInMode.value = 'signup';
  showSignIn.value = true;
  currentView.value = 'signin';
  mobileMenuOpen.value = false;
  profileMenuOpen.value = false;
};

const handleOpenSettings = () => {
  showSettings.value = true;
  currentView.value = 'settings';
  profileMenuOpen.value = false;
  mobileMenuOpen.value = false;
};

const handleCloseSettings = () => {
  showSettings.value = false;
  currentView.value = 'dashboard';
};

const toggleProfileMenu = () => {
  profileMenuOpen.value = !profileMenuOpen.value;
};

// Close profile menu when clicking outside
const handleClickOutside = (event) => {
  const target = event.target;
  if (!target.closest('.profile-menu-container')) {
    profileMenuOpen.value = false;
  }
};

// Add click outside listener
onMounted(async () => {
  await loadUser();
  document.addEventListener('click', handleClickOutside);
  
  // Ensure we're on dashboard if authenticated and on signin view
  if (isAuthenticated.value && currentView.value === 'signin') {
    console.log('User is authenticated but on signin view, redirecting to dashboard');
    currentView.value = 'dashboard';
    showSignIn.value = false;
  }
  
  // Default to dashboard if no view is set
  if (!currentView.value || currentView.value === '') {
    currentView.value = 'dashboard';
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleCloseSignIn = () => {
  showSignIn.value = false;
  currentView.value = 'dashboard';
  mobileMenuOpen.value = false;
};

const handleSignedIn = async (signedInUser) => {
  console.log('🔐 handleSignedIn called, user:', signedInUser);
  
  try {
    // User is already set by login() function in useAuth
    // Refresh user data to confirm session
    await loadUser();
    
    console.log('User loaded:', user.value, 'isAuthenticated:', isAuthenticated.value);
    
    // Change view to dashboard
    currentView.value = 'dashboard';
    showSignIn.value = false;
    showCreator.value = false;
    selectedTournamentId.value = null;
    mobileMenuOpen.value = false;
    profileMenuOpen.value = false;
    
    console.log('View changed to dashboard:', currentView.value);
    
    // Wait for Vue to update
    await nextTick();
    
    console.log('✅ Login complete, redirecting...');
    
    // Reload page after delay to ensure clean state
    // Increased delay to ensure login completes
    setTimeout(() => {
      console.log('🔄 Reloading page after successful login...');
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error in handleSignedIn:', error);
    // If error, at least try to redirect without reload
    currentView.value = 'dashboard';
    showSignIn.value = false;
  }
};

const handleSignedUp = (signedUpUser) => {
  // User signed up, they'll be prompted to sign in
  // User is already set by useAuth composable
};

const handleLogout = async () => {
  await authLogout();
  currentView.value = 'dashboard';
  mobileMenuOpen.value = false;
};

// Load user on app start
onMounted(async () => {
  await loadUser();
});
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
          <nav class="hidden md:flex gap-2 items-center">
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
            
            <!-- Profile Icon with Dropdown -->
            <div class="relative profile-menu-container">
              <button
                @click.stop="toggleProfileMenu"
                class="p-2 text-gray-300 hover:bg-gray-700/60 active:bg-gray-700/60 rounded-xl transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center relative"
                aria-label="Profile menu"
              >
                <!-- Profile Icon -->
                <svg v-if="!currentUser" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <!-- User Avatar with Initial -->
                <div v-else class="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {{ currentUser?.name?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="profileMenuOpen"
                @click.stop
                class="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden z-50"
              >
                <!-- Not Logged In -->
                <template v-if="!currentUser">
                  <button
                    @click="handleOpenSignIn"
                    class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700/60 transition-colors flex items-center gap-3 min-h-[44px]"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </button>
                  <button
                    @click="handleOpenSignUp"
                    class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700/60 transition-colors flex items-center gap-3 min-h-[44px] border-t border-gray-700/50"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign Up
                  </button>
                </template>

                <!-- Logged In -->
                <template v-else>
                  <div class="px-4 py-3 border-b border-gray-700/50">
                    <div class="text-sm font-semibold text-gray-200">{{ currentUser?.name || 'User' }}</div>
                    <div class="text-xs text-gray-400 mt-1">{{ currentUser?.email }}</div>
                  </div>
                  <button
                    @click="handleOpenSettings"
                    class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700/60 transition-colors flex items-center gap-3 min-h-[44px]"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <button
                    @click="handleLogout"
                    class="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700/60 transition-colors flex items-center gap-3 min-h-[44px] border-t border-gray-700/50"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </template>
              </div>
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
          <!-- Mobile Profile Menu -->
          <div v-if="!currentUser" class="space-y-2">
            <button
              @click="handleOpenSignIn; mobileMenuOpen = false"
              class="w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left text-gray-300 active:bg-gray-700/60 min-h-[44px]"
            >
              Sign In
            </button>
            <button
              @click="handleOpenSignUp; mobileMenuOpen = false"
              class="w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-left text-gray-300 active:bg-gray-700/60 min-h-[44px]"
            >
              Sign Up
            </button>
          </div>
          <div
            v-else
            class="px-4 py-3 rounded-xl text-gray-300 space-y-2"
          >
            <div class="font-semibold">{{ currentUser?.name || 'User' }}</div>
            <div class="text-xs text-gray-400">{{ currentUser?.email }}</div>
            <button
              @click="handleOpenSettings; mobileMenuOpen = false"
              class="w-full text-left text-gray-300 active:text-gray-200 transition-colors text-sm min-h-[44px] px-2"
            >
              Settings
            </button>
            <button
              @click="handleLogout; mobileMenuOpen = false"
              class="w-full text-left text-red-400 active:text-red-300 transition-colors text-sm min-h-[44px] px-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <!-- Show loading spinner while checking auth -->
      <div v-if="authLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p class="text-gray-400">Loading...</p>
        </div>
      </div>
      
      <!-- Content when auth check is complete -->
      <template v-else>
        <!-- Only show SignIn if we're on signin view AND not authenticated -->
        <SignIn
          v-if="currentView === 'signin' && !isAuthenticated"
          :initial-mode="signInMode"
          @close="handleCloseSignIn"
          @signed-in="handleSignedIn"
          @signed-up="handleSignedUp"
        />
        <Settings
          v-else-if="currentView === 'settings'"
          @close="handleCloseSettings"
        />
        <TournamentCreator
          v-else-if="currentView === 'dashboard' && showCreator"
          :initial-tournament-type="selectedTournamentType"
          @tournament-created="handleTournamentCreated"
          @cancel="showCreator = false"
        />
        <Dashboard
          v-else-if="currentView === 'dashboard'"
          @start-tournament="handleStartTournament"
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
        <!-- Fallback to Dashboard if nothing matches -->
        <Dashboard
          v-else
          @start-tournament="handleStartTournament"
        />
      </template>
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
