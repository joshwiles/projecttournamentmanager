/**
 * Authentication composable for Vue
 * Uses singleton pattern for shared auth state
 */

import { ref, computed } from 'vue';
import { API_BASE } from '../config/api.js';
import { safeJsonParse, handleNetworkError } from '../utils/apiHelpers.js';

// Shared state (singleton)
const user = ref(null);
const loading = ref(false);
const initialCheckDone = ref(false);
const error = ref('');

/**
 * Check if user is authenticated
 */
export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  /**
   * Load current user from session
   */
  const loadUser = async () => {
    loading.value = true;
    error.value = '';

    try {
      const url = `${API_BASE}/auth/me`;
      const response = await fetch(url, {
        credentials: 'include', // Important: include cookies
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      // 401 means not logged in - that's OK
      if (response.status === 401) {
        user.value = null;
        return;
      }

      const data = await safeJsonParse(response);

      if (response.ok && data.success && data.user) {
        user.value = data.user;
      } else {
        user.value = null;
      }
    } catch (err) {
      console.error('Error loading user:', err);
      user.value = null;
      // Don't set error for auth check failures
    } finally {
      loading.value = false;
      initialCheckDone.value = true;
    }
  };

  /**
   * Sign up a new user
   */
  const signup = async (email, password, name) => {
    loading.value = true;
    error.value = '';

    try {
      const url = `${API_BASE}/auth/signup`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password, name }),
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      const data = await safeJsonParse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account');
      }

      user.value = data.user;
      return { success: true, user: data.user };
    } catch (err) {
      error.value = err.message || 'Failed to create account';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sign in an existing user
   */
  const login = async (email, password) => {
    loading.value = true;
    error.value = '';

    try {
      const url = `${API_BASE}/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password }),
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      const data = await safeJsonParse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in');
      }

      user.value = data.user;
      return { success: true, user: data.user };
    } catch (err) {
      error.value = err.message || 'Failed to sign in';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sign out the current user
   */
  const logout = async () => {
    loading.value = true;
    error.value = '';

    try {
      const url = `${API_BASE}/auth/logout`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      const data = await safeJsonParse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign out');
      }

      user.value = null;
      return { success: true };
    } catch (err) {
      error.value = err.message || 'Failed to sign out';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update user profile (name and/or email)
   */
  const updateProfile = async (name, email) => {
    loading.value = true;
    error.value = '';

    try {
      const url = `${API_BASE}/auth/profile`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      const data = await safeJsonParse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      user.value = data.user;
      return { success: true, user: data.user };
    } catch (err) {
      error.value = err.message || 'Failed to update profile';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Change user password
   */
  const updatePassword = async (currentPassword, newPassword) => {
    loading.value = true;
    error.value = '';

    try {
      const url = `${API_BASE}/auth/password`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      const data = await safeJsonParse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }

      return { success: true };
    } catch (err) {
      error.value = err.message || 'Failed to change password';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update user preferences (theme, etc.)
   */
  const updatePreferences = async (prefs) => {
    try {
      const url = `${API_BASE}/auth/preferences`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prefs),
      }).catch((fetchError) => {
        throw handleNetworkError(fetchError, url);
      });

      const data = await safeJsonParse(response);

      if (response.ok && data.success && data.user) {
        user.value = data.user;
      }
    } catch (err) {
      // Fire-and-forget — don't surface preference save errors
      console.error('Error saving preferences:', err);
    }
  };

  return {
    user,
    loading,
    initialCheckDone,
    error,
    isAuthenticated,
    loadUser,
    signup,
    login,
    logout,
    updateProfile,
    updatePassword,
    updatePreferences,
  };
}
