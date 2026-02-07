const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const SavedTournament = require('../models/SavedTournament');

/**
 * POST /api/saved-tournaments
 * Save a tournament to the database
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { tournament } = req.body;
    if (!tournament) {
      return res.status(400).json({ success: false, error: 'Tournament data is required' });
    }

    const saved = await SavedTournament.create(req.session.userId, tournament);
    res.status(201).json({ success: true, savedTournament: saved });
  } catch (err) {
    console.error('Error saving tournament:', err);
    res.status(500).json({ success: false, error: 'Failed to save tournament' });
  }
});

/**
 * GET /api/saved-tournaments
 * List current user's saved tournaments
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const tournaments = await SavedTournament.listByUser(req.session.userId);
    res.json({ success: true, savedTournaments: tournaments });
  } catch (err) {
    console.error('Error listing saved tournaments:', err);
    res.status(500).json({ success: false, error: 'Failed to list saved tournaments' });
  }
});

/**
 * GET /api/saved-tournaments/:id
 * Load a saved tournament (full data)
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const saved = await SavedTournament.findById(parseInt(req.params.id), req.session.userId);
    if (!saved) {
      return res.status(404).json({ success: false, error: 'Saved tournament not found' });
    }
    res.json({ success: true, savedTournament: saved });
  } catch (err) {
    console.error('Error loading saved tournament:', err);
    res.status(500).json({ success: false, error: 'Failed to load saved tournament' });
  }
});

/**
 * PUT /api/saved-tournaments/:id
 * Update an existing saved tournament
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { tournament } = req.body;
    if (!tournament) {
      return res.status(400).json({ success: false, error: 'Tournament data is required' });
    }

    const updated = await SavedTournament.update(parseInt(req.params.id), req.session.userId, tournament);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Saved tournament not found' });
    }
    res.json({ success: true, savedTournament: updated });
  } catch (err) {
    console.error('Error updating saved tournament:', err);
    res.status(500).json({ success: false, error: 'Failed to update saved tournament' });
  }
});

/**
 * DELETE /api/saved-tournaments/:id
 * Delete a saved tournament
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await SavedTournament.delete(parseInt(req.params.id), req.session.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Saved tournament not found' });
    }
    res.json({ success: true, message: 'Saved tournament deleted' });
  } catch (err) {
    console.error('Error deleting saved tournament:', err);
    res.status(500).json({ success: false, error: 'Failed to delete saved tournament' });
  }
});

module.exports = router;
