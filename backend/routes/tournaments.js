const express = require('express');
const router = express.Router();
const SwissPairing = require('../utils/swissPairing');
const SwissUSCF = require('../utils/swissUscf');
const SwissFideDutch = require('../utils/swissFideDutch');
const SwissAccelerated = require('../utils/swissAccelerated');
const RoundRobinPairing = require('../utils/roundRobinPairing');

// In-memory storage (in production, use a database)
let tournaments = [];
let tournamentIdCounter = 1;

/**
 * GET /api/tournaments
 * Get all tournaments
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    tournaments: tournaments.map(t => ({
      id: t.id,
      name: t.name,
      tournamentType: t.tournamentType || 'swiss',
      numberOfRounds: t.numberOfRounds,
      currentRound: t.currentRound,
      status: t.status,
      createdAt: t.createdAt,
      playerCount: t.players.length,
    })),
  });
});

/**
 * GET /api/tournaments/:id
 * Get tournament by ID
 */
router.get('/:id', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  // Use appropriate pairing algorithm based on tournament type
  const tournamentType = tournament.tournamentType || 'swiss';
  const standings = tournamentType === 'swiss'
    ? SwissPairing.calculateStandings(tournament)
    : RoundRobinPairing.calculateStandings(tournament);

  res.json({
    success: true,
    tournament: {
      ...tournament,
      standings,
    },
  });
});

/**
 * POST /api/tournaments
 * Create a new tournament
 */
router.post('/', (req, res) => {
  const { name, numberOfRounds, tournamentType } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Tournament name is required',
    });
  }

  const type = tournamentType || 'swiss';
  let rounds = parseInt(numberOfRounds) || 0;

  // Validate and calculate rounds based on type
  const swissTypes = new Set([
    'swiss',
    'swiss_uscf',
    'swiss_fide_dutch',
    'swiss_accelerated',
  ]);

  if (swissTypes.has(type)) {
    if (!rounds || rounds < 1 || rounds > 20) {
      return res.status(400).json({
        success: false,
        error: 'Number of rounds must be between 1 and 20 for Swiss tournaments',
      });
    }
  } else if (type === 'round_robin' || type === 'double_round_robin') {
    // Rounds will be calculated when tournament starts based on number of players
    rounds = 0; // Placeholder, will be calculated
  } else {
    return res.status(400).json({
      success: false,
      error: 'Invalid tournament type. Must be a Swiss, round robin, or double round robin format',
    });
  }

  const tournament = {
    id: tournamentIdCounter++,
    name,
    tournamentType: type,
    numberOfRounds: rounds,
    players: [],
    rounds: [],
    currentRound: 0,
    status: 'registration', // registration, in_progress, completed
    createdAt: new Date().toISOString(),
  };

  tournaments.push(tournament);

  res.status(201).json({
    success: true,
    tournament,
  });
});

/**
 * POST /api/tournaments/:id/players
 * Add a player to tournament
 */
router.post('/:id/players', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  if (tournament.status !== 'registration') {
    return res.status(400).json({
      success: false,
      error: 'Cannot add players after tournament has started',
    });
  }

  const { name, rating } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Player name is required',
    });
  }

  // Check for duplicate names
  if (tournament.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Player with this name already exists',
    });
  }

  // Validate rating if provided
  let playerRating = null;
  if (rating !== undefined && rating !== null && rating !== '') {
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 0 and 3000',
      });
    }
    playerRating = ratingNum;
  }

  const player = {
    id: Date.now() + Math.random(), // Simple ID generation
    name: name.trim(),
    rating: playerRating, // null for unrated players
  };

  tournament.players.push(player);

  res.json({
    success: true,
    player,
    tournament: {
      id: tournament.id,
      name: tournament.name,
      playerCount: tournament.players.length,
    },
  });
});

/**
 * DELETE /api/tournaments/:id/players/:playerId
 * Remove a player from tournament
 */
router.delete('/:id/players/:playerId', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  if (tournament.status !== 'registration') {
    return res.status(400).json({
      success: false,
      error: 'Cannot remove players after tournament has started',
    });
  }

  const playerId = req.params.playerId;
  const playerIndex = tournament.players.findIndex(p => p.id.toString() === playerId);

  if (playerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Player not found',
    });
  }

  tournament.players.splice(playerIndex, 1);

  res.json({
    success: true,
    message: 'Player removed',
  });
});

/**
 * DELETE /api/tournaments/:id
 * Delete a tournament
 */
router.delete('/:id', (req, res) => {
  const tournamentId = parseInt(req.params.id);
  const tournamentIndex = tournaments.findIndex(t => t.id === tournamentId);
  
  if (tournamentIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  // Remove tournament from array
  tournaments.splice(tournamentIndex, 1);

  res.json({
    success: true,
    message: 'Tournament deleted successfully',
  });
});

/**
 * POST /api/tournaments/:id/start
 * Start the tournament (generate first round)
 */
router.post('/:id/start', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  if (tournament.players.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Tournament needs at least 2 players',
    });
  }

  if (tournament.status !== 'registration') {
    return res.status(400).json({
      success: false,
      error: 'Tournament has already started',
    });
  }

  tournament.status = 'in_progress';
  tournament.currentRound = 1;

  const tournamentType = tournament.tournamentType || 'swiss';
  const isDoubleRoundRobin = tournamentType === 'double_round_robin';
  const isRoundRobin = tournamentType === 'round_robin' || isDoubleRoundRobin;
  const isSwissUSCF = tournamentType === 'swiss_uscf';
  const isSwissFideDutch = tournamentType === 'swiss_fide_dutch';
  const isSwissAccelerated = tournamentType === 'swiss_accelerated';

  // Calculate number of rounds for round robin
  if (isRoundRobin) {
    tournament.numberOfRounds = RoundRobinPairing.calculateRounds(
      tournament.players.length,
      isDoubleRoundRobin
    );
  }

  // Assign pairing numbers for round robin (by lot)
  if (isRoundRobin) {
    const playersWithNumbers = RoundRobinPairing.assignPairingNumbers(tournament.players);
    tournament.players = playersWithNumbers;
  }

  // Generate first round pairings
  const players = tournament.players.map(p => ({
    id: p.id,
    name: p.name,
    rating: p.rating || null,
    pairingNumber: p.pairingNumber || null,
    score: 0,
    colorBalance: 0,
    colorHistory: [],
    previousOpponents: [],
  }));

  let pairingResult;
  if (isRoundRobin) {
    pairingResult = { pairings: RoundRobinPairing.generatePairings(players, 1, isDoubleRoundRobin) };
  } else if (isSwissUSCF) {
    pairingResult = SwissUSCF.generatePairings(players, 1, tournament.players, tournament.rounds);
  } else if (isSwissFideDutch) {
    pairingResult = SwissFideDutch.generatePairings(players, 1, tournament.players, tournament.rounds);
  } else if (isSwissAccelerated) {
    pairingResult = SwissAccelerated.generatePairings(
      players,
      1,
      tournament.players,
      tournament.rounds,
      tournament.numberOfRounds
    );
  } else {
    pairingResult = SwissPairing.generatePairings(players, 1, tournament.players, tournament.rounds);
  }

  tournament.rounds.push({
    roundNumber: 1,
    pairings: pairingResult.pairings,
    forcedRepeat: pairingResult.forcedRepeat || false,
    repeatCount: pairingResult.repeatCount || 0,
    completed: false,
  });

  res.json({
    success: true,
    tournament: {
      id: tournament.id,
      currentRound: tournament.currentRound,
      round: tournament.rounds[0],
    },
  });
});

/**
 * GET /api/tournaments/:id/rounds/:roundNumber
 * Get round details
 */
router.get('/:id/rounds/:roundNumber', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  const roundNumber = parseInt(req.params.roundNumber);
  const round = tournament.rounds.find(r => r.roundNumber === roundNumber);

  if (!round) {
    return res.status(404).json({
      success: false,
      error: 'Round not found',
    });
  }

  res.json({
    success: true,
    round,
  });
});

/**
 * POST /api/tournaments/:id/rounds/:roundNumber/pairings/:pairingIndex/result
 * Record result for a pairing
 */
router.post('/:id/rounds/:roundNumber/pairings/:pairingIndex/result', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  const roundNumber = parseInt(req.params.roundNumber);
  const pairingIndex = parseInt(req.params.pairingIndex);
  const round = tournament.rounds.find(r => r.roundNumber === roundNumber);

  if (!round) {
    return res.status(404).json({
      success: false,
      error: 'Round not found',
    });
  }

  if (pairingIndex < 0 || pairingIndex >= round.pairings.length) {
    return res.status(400).json({
      success: false,
      error: 'Invalid pairing index',
    });
  }

  const { result } = req.body;
  const validResults = ['1-0', '0-1', '1/2-1/2'];
  
  if (!result || !validResults.includes(result)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid result. Must be one of: 1-0, 0-1, 1/2-1/2',
    });
  }

  round.pairings[pairingIndex].result = result;

  res.json({
    success: true,
    pairing: round.pairings[pairingIndex],
  });
});

/**
 * POST /api/tournaments/:id/rounds/:roundNumber/complete
 * Complete a round and generate next round
 */
router.post('/:id/rounds/:roundNumber/complete', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  const roundNumber = parseInt(req.params.roundNumber);
  const round = tournament.rounds.find(r => r.roundNumber === roundNumber);

  if (!round) {
    return res.status(404).json({
      success: false,
      error: 'Round not found',
    });
  }

  // Check if all pairings have results
  const incompletePairings = round.pairings.filter(
    p => !p.isBye && !p.result
  );

  if (incompletePairings.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'All pairings must have results before completing the round',
      incompletePairings: incompletePairings.length,
    });
  }

  round.completed = true;
  round.completedAt = new Date().toISOString();

  // Check if tournament is complete
  if (roundNumber >= tournament.numberOfRounds) {
    tournament.status = 'completed';
    tournament.currentRound = roundNumber;

    const tournamentType = tournament.tournamentType || 'swiss';
    const standings = tournamentType === 'swiss'
      ? SwissPairing.calculateStandings(tournament)
      : RoundRobinPairing.calculateStandings(tournament);

    return res.json({
      success: true,
      tournament: {
        id: tournament.id,
        status: tournament.status,
        standings,
      },
      message: 'Tournament completed!',
    });
  }

  // Generate next round
  const tournamentType = tournament.tournamentType || 'swiss';
  const isDoubleRoundRobin = tournamentType === 'double_round_robin';
  const isRoundRobin = tournamentType === 'round_robin' || isDoubleRoundRobin;
  const isSwissUSCF = tournamentType === 'swiss_uscf';
  const isSwissFideDutch = tournamentType === 'swiss_fide_dutch';
  const isSwissAccelerated = tournamentType === 'swiss_accelerated';
  
  const standings = isRoundRobin
    ? RoundRobinPairing.calculateStandings(tournament)
    : SwissPairing.calculateStandings(tournament);
  
  const players = tournament.players.map(p => {
    const standing = standings.find(s => s.id === p.id);
    return {
      id: p.id,
      name: p.name,
      rating: p.rating || null,
      pairingNumber: p.pairingNumber || null,
      score: standing ? standing.score : 0,
      colorBalance: standing ? standing.colorBalance : 0,
      colorHistory: standing ? (standing.colorHistory || []) : [],
      previousOpponents: standing ? (standing.previousOpponents || []) : [],
    };
  });

  const nextRoundNumber = roundNumber + 1;
  let nextPairingResult;
  if (isRoundRobin) {
    nextPairingResult = { pairings: RoundRobinPairing.generatePairings(players, nextRoundNumber, isDoubleRoundRobin) };
  } else if (isSwissUSCF) {
    nextPairingResult = SwissUSCF.generatePairings(players, nextRoundNumber, tournament.players, tournament.rounds);
  } else if (isSwissFideDutch) {
    nextPairingResult = SwissFideDutch.generatePairings(players, nextRoundNumber, tournament.players, tournament.rounds);
  } else if (isSwissAccelerated) {
    nextPairingResult = SwissAccelerated.generatePairings(
      players,
      nextRoundNumber,
      tournament.players,
      tournament.rounds,
      tournament.numberOfRounds
    );
  } else {
    nextPairingResult = SwissPairing.generatePairings(players, nextRoundNumber, tournament.players, tournament.rounds);
  }

  tournament.rounds.push({
    roundNumber: nextRoundNumber,
    pairings: nextPairingResult.pairings,
    forcedRepeat: nextPairingResult.forcedRepeat || false,
    repeatCount: nextPairingResult.repeatCount || 0,
    completed: false,
  });

  tournament.currentRound = nextRoundNumber;

  res.json({
    success: true,
    tournament: {
      id: tournament.id,
      currentRound: tournament.currentRound,
    },
    nextRound: tournament.rounds[tournament.rounds.length - 1],
    standings,
  });
});

/**
 * GET /api/tournaments/:id/standings
 * Get tournament standings
 */
router.get('/:id/standings', (req, res) => {
  const tournament = tournaments.find(t => t.id === parseInt(req.params.id));
  
  if (!tournament) {
    return res.status(404).json({
      success: false,
      error: 'Tournament not found',
    });
  }

  const standings = SwissPairing.calculateStandings(tournament);

  res.json({
    success: true,
    standings,
  });
});

module.exports = router;

