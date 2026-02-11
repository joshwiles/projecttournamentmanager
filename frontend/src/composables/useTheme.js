/**
 * Theme composable for accent color selection
 * Uses singleton pattern for shared theme state
 */

import { ref, computed } from 'vue';
import { useAuth } from './useAuth.js';

const STORAGE_KEY = 'chess-tm-theme';

const themes = [
  {
    id: 'indigo',
    label: 'Indigo',
    preview: { from: '#818cf8', to: '#a78bfa' }, // indigo-400, purple-400
    classes: {
      bodyGradient: 'from-gray-900 via-slate-900 to-indigo-950',
      titleGradient: 'from-indigo-400 via-purple-400 to-pink-400',
      headingGradient: 'from-indigo-400 to-purple-400',
      buttonGradient: 'from-indigo-600 to-purple-600',
      buttonHover: 'hover:from-indigo-500 hover:to-purple-500',
      buttonActive: 'active:from-indigo-500 active:to-purple-500',
      buttonSolid: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
      buttonSolidAlt: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-700',
      shadow: 'shadow-indigo-500/20',
      shadowLg: 'shadow-indigo-500/30',
      shadowActive: 'shadow-indigo-500/50',
      shadowHoverActive: 'hover:shadow-indigo-500/50 active:shadow-indigo-500/50',
      shadowSm: 'shadow-indigo-500/10',
      focusRing: 'focus:ring-indigo-500 focus:border-indigo-500',
      spinner: 'border-indigo-500',
      avatarGradient: 'from-indigo-500 to-purple-600',
      avatarShadow: 'hover:shadow-indigo-500/30',
      infoBg: 'from-indigo-900/30 to-purple-900/30',
      infoBorder: 'border-indigo-700/50',
      infoAccent: 'text-indigo-400',
      hoverBorder: 'hover:border-indigo-500/50',
      navActive: 'from-indigo-600 to-purple-600',
      navActiveShadow: 'shadow-indigo-500/20',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    preview: { from: '#34d399', to: '#2dd4bf' }, // emerald-400, teal-400
    classes: {
      bodyGradient: 'from-gray-900 via-slate-900 to-emerald-950',
      titleGradient: 'from-emerald-400 via-teal-400 to-cyan-400',
      headingGradient: 'from-emerald-400 to-teal-400',
      buttonGradient: 'from-emerald-600 to-teal-600',
      buttonHover: 'hover:from-emerald-500 hover:to-teal-500',
      buttonActive: 'active:from-emerald-500 active:to-teal-500',
      buttonSolid: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
      buttonSolidAlt: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-700',
      shadow: 'shadow-emerald-500/20',
      shadowLg: 'shadow-emerald-500/30',
      shadowActive: 'shadow-emerald-500/50',
      shadowHoverActive: 'hover:shadow-emerald-500/50 active:shadow-emerald-500/50',
      shadowSm: 'shadow-emerald-500/10',
      focusRing: 'focus:ring-emerald-500 focus:border-emerald-500',
      spinner: 'border-emerald-500',
      avatarGradient: 'from-emerald-500 to-teal-600',
      avatarShadow: 'hover:shadow-emerald-500/30',
      infoBg: 'from-emerald-900/30 to-teal-900/30',
      infoBorder: 'border-emerald-700/50',
      infoAccent: 'text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50',
      navActive: 'from-emerald-600 to-teal-600',
      navActiveShadow: 'shadow-emerald-500/20',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    preview: { from: '#fb7185', to: '#f472b6' }, // rose-400, pink-400
    classes: {
      bodyGradient: 'from-gray-900 via-slate-900 to-rose-950',
      titleGradient: 'from-rose-400 via-pink-400 to-fuchsia-400',
      headingGradient: 'from-rose-400 to-pink-400',
      buttonGradient: 'from-rose-600 to-pink-600',
      buttonHover: 'hover:from-rose-500 hover:to-pink-500',
      buttonActive: 'active:from-rose-500 active:to-pink-500',
      buttonSolid: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
      buttonSolidAlt: 'bg-pink-600 hover:bg-pink-700 active:bg-pink-700',
      shadow: 'shadow-rose-500/20',
      shadowLg: 'shadow-rose-500/30',
      shadowActive: 'shadow-rose-500/50',
      shadowHoverActive: 'hover:shadow-rose-500/50 active:shadow-rose-500/50',
      shadowSm: 'shadow-rose-500/10',
      focusRing: 'focus:ring-rose-500 focus:border-rose-500',
      spinner: 'border-rose-500',
      avatarGradient: 'from-rose-500 to-pink-600',
      avatarShadow: 'hover:shadow-rose-500/30',
      infoBg: 'from-rose-900/30 to-pink-900/30',
      infoBorder: 'border-rose-700/50',
      infoAccent: 'text-rose-400',
      hoverBorder: 'hover:border-rose-500/50',
      navActive: 'from-rose-600 to-pink-600',
      navActiveShadow: 'shadow-rose-500/20',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    preview: { from: '#fbbf24', to: '#f59e0b' }, // amber-400, amber-500
    classes: {
      bodyGradient: 'from-gray-900 via-slate-900 to-amber-950',
      titleGradient: 'from-amber-400 via-yellow-400 to-orange-400',
      headingGradient: 'from-amber-400 to-yellow-400',
      buttonGradient: 'from-amber-600 to-orange-600',
      buttonHover: 'hover:from-amber-500 hover:to-orange-500',
      buttonActive: 'active:from-amber-500 active:to-orange-500',
      buttonSolid: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
      buttonSolidAlt: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-700',
      shadow: 'shadow-amber-500/20',
      shadowLg: 'shadow-amber-500/30',
      shadowActive: 'shadow-amber-500/50',
      shadowHoverActive: 'hover:shadow-amber-500/50 active:shadow-amber-500/50',
      shadowSm: 'shadow-amber-500/10',
      focusRing: 'focus:ring-amber-500 focus:border-amber-500',
      spinner: 'border-amber-500',
      avatarGradient: 'from-amber-500 to-orange-600',
      avatarShadow: 'hover:shadow-amber-500/30',
      infoBg: 'from-amber-900/30 to-orange-900/30',
      infoBorder: 'border-amber-700/50',
      infoAccent: 'text-amber-400',
      hoverBorder: 'hover:border-amber-500/50',
      navActive: 'from-amber-600 to-orange-600',
      navActiveShadow: 'shadow-amber-500/20',
    },
  },
  {
    id: 'sky',
    label: 'Sky',
    preview: { from: '#38bdf8', to: '#60a5fa' }, // sky-400, blue-400
    classes: {
      bodyGradient: 'from-gray-900 via-slate-900 to-sky-950',
      titleGradient: 'from-sky-400 via-blue-400 to-violet-400',
      headingGradient: 'from-sky-400 to-blue-400',
      buttonGradient: 'from-sky-600 to-blue-600',
      buttonHover: 'hover:from-sky-500 hover:to-blue-500',
      buttonActive: 'active:from-sky-500 active:to-blue-500',
      buttonSolid: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
      buttonSolidAlt: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-700',
      shadow: 'shadow-sky-500/20',
      shadowLg: 'shadow-sky-500/30',
      shadowActive: 'shadow-sky-500/50',
      shadowHoverActive: 'hover:shadow-sky-500/50 active:shadow-sky-500/50',
      shadowSm: 'shadow-sky-500/10',
      focusRing: 'focus:ring-sky-500 focus:border-sky-500',
      spinner: 'border-sky-500',
      avatarGradient: 'from-sky-500 to-blue-600',
      avatarShadow: 'hover:shadow-sky-500/30',
      infoBg: 'from-sky-900/30 to-blue-900/30',
      infoBorder: 'border-sky-700/50',
      infoAccent: 'text-sky-400',
      hoverBorder: 'hover:border-sky-500/50',
      navActive: 'from-sky-600 to-blue-600',
      navActiveShadow: 'shadow-sky-500/20',
    },
  },
];

// Singleton state
const currentThemeId = ref('indigo');

// Load from localStorage
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && themes.some(t => t.id === saved)) {
    currentThemeId.value = saved;
  }
} catch {
  // localStorage unavailable
}

const currentTheme = computed(() =>
  themes.find(t => t.id === currentThemeId.value) || themes[0]
);

const tc = computed(() => currentTheme.value.classes);

function setTheme(id) {
  if (themes.some(t => t.id === id)) {
    currentThemeId.value = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable
    }
    // Persist to server if logged in (fire-and-forget)
    const { isAuthenticated, updatePreferences } = useAuth();
    if (isAuthenticated.value) {
      updatePreferences({ theme: id });
    }
  }
}

/**
 * Apply theme from user data (called after login/load)
 */
function syncFromUser(userData) {
  const themeId = userData?.preferences?.theme;
  if (themeId && themes.some(t => t.id === themeId)) {
    currentThemeId.value = themeId;
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // localStorage unavailable
    }
  }
}

export function useTheme() {
  return {
    themes,
    currentThemeId,
    currentTheme,
    tc,
    setTheme,
    syncFromUser,
  };
}
