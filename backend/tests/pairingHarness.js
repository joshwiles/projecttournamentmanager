/**
 * Pairing Test Harness
 * 
 * A unified harness for testing all pairing methods with:
 * - Deterministic player seeding
 * - Round-by-round execution
 * - Result application (scripted or random)
 * - Comprehensive metrics collection
 * - Hard and soft invariant assertions
 */

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Generate deterministic players with ratings
 */
function makeRandomPlayers(seed, count, baseRating = 2000) {
  // Simple seeded RNG (linear congruential generator)
  let rng = seed;
  const next = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `Player ${idx + 1}`,
    rating: Math.floor(baseRating - idx * 50 - next() * 200),
    pairingNumber: idx + 1,
  }));
}

/**
 * Seeded random result generator
 * Returns deterministic results based on seed
 */
function seededRandomResults({ round, pairing, state, seed }) {
  const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);
  const results = {};
  let boardNum = 0;

  for (const p of pairings) {
    boardNum++;
    // Use round and pairing indices for deterministic randomness
    const rngSeed = seed + round * 1000 + (p.boardNumber || boardNum) * 100;
    let rng = rngSeed;
    const next = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };

    if (p.isBye) {
      results[p.player1.id] = { result: '1-0', score: 1 };
      continue;
    }
    if (!p.player1 || !p.player2) continue;

    const rand = next();
    if (rand < 0.4) {
      // White wins
      results[p.player1.id] = { result: '1-0', score: 1 };
      results[p.player2.id] = { result: '0-1', score: 0 };
    } else if (rand < 0.7) {
      // Black wins
      results[p.player1.id] = { result: '0-1', score: 0 };
      results[p.player2.id] = { result: '1-0', score: 1 };
    } else {
      // Draw
      results[p.player1.id] = { result: '1/2-1/2', score: 0.5 };
      results[p.player2.id] = { result: '1/2-1/2', score: 0.5 };
    }
  }
  return results;
}

/**
 * Apply results to a round's pairings
 */
function applyResults(pairing, results) {
  const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);
  for (const p of pairings) {
    if (p.isBye) {
      p.result = '1-0';
      continue;
    }
    if (p.player1 && results[p.player1.id]) {
      p.result = results[p.player1.id].result;
    }
  }
}

/**
 * Calculate metrics for a tournament run
 */
function calculateMetrics({ state, allRounds, players: initialPlayers }) {
  const metrics = {
    repeatCount: 0,
    forcedRepeatRounds: 0,
    consecutiveRepeatCount: 0,
    scoreGaps: [],
    colorImbalances: [],
    maxColorStreak: 0,
    floatCountDown: 0,
    floatCountUp: 0,
    topSeedOppRatings: [],
  };

  const playerMap = new Map(initialPlayers.map(p => [p.id, p]));
  const allPlayedPairs = new Set();
  const lastRoundPairs = new Set();

  for (let i = 0; i < allRounds.length; i++) {
    const { r, pairing } = allRounds[i];
    const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);
    const roundPairs = new Set();
    const roundRepeats = new Set();
    let roundForcedRepeat = false;

    if (pairing.forcedRepeat) {
      metrics.forcedRepeatRounds++;
      roundForcedRepeat = true;
    }

    for (const p of pairings) {
      if (p.isBye || !p.player1 || !p.player2) continue;

      const key = pairKey(p.player1.id, p.player2.id);
      roundPairs.add(key);

      if (allPlayedPairs.has(key)) {
        metrics.repeatCount++;
        roundRepeats.add(key);
      }

      if (lastRoundPairs.has(key)) {
        metrics.consecutiveRepeatCount++;
      }

      allPlayedPairs.add(key);

      // Score gap
      const p1 = state.players.find(pl => pl.id === p.player1.id);
      const p2 = state.players.find(pl => pl.id === p.player2.id);
      if (p1 && p2) {
        metrics.scoreGaps.push(Math.abs(p1.score - p2.score));
      }

      // Opponent rating for top seeds
      if (i === allRounds.length - 1) { // Last round
        const initialP1 = playerMap.get(p.player1.id);
        const initialP2 = playerMap.get(p.player2.id);
        if (initialP1 && initialP2) {
          const p1Rank = initialPlayers.findIndex(pl => pl.id === p.player1.id);
          if (p1Rank < 3) { // Top 3 seeds
            metrics.topSeedOppRatings.push(initialP2.rating || 0);
          }
        }
      }
    }

    lastRoundPairs.clear();
    for (const key of roundPairs) {
      lastRoundPairs.add(key);
    }
  }

  // Color balance analysis
  for (const player of state.players) {
    if (player.colorHistory && player.colorHistory.length > 0) {
      metrics.colorImbalances.push(Math.abs(player.colorBalance || 0));

      // Check for color streaks
      let currentStreak = 1;
      let maxStreak = 1;
      for (let i = 1; i < player.colorHistory.length; i++) {
        if (player.colorHistory[i] === player.colorHistory[i - 1]) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      metrics.maxColorStreak = Math.max(metrics.maxColorStreak, maxStreak);
    }
  }

  // Float analysis (simplified - would need more context)
  // For now, we'll track score-based floats

  return {
    ...metrics,
    avgScoreGap: metrics.scoreGaps.length > 0
      ? metrics.scoreGaps.reduce((a, b) => a + b, 0) / metrics.scoreGaps.length
      : 0,
    maxScoreGap: metrics.scoreGaps.length > 0 ? Math.max(...metrics.scoreGaps) : 0,
    colorImbalanceAvg: metrics.colorImbalances.length > 0
      ? metrics.colorImbalances.reduce((a, b) => a + b, 0) / metrics.colorImbalances.length
      : 0,
    topSeedOppAvg: metrics.topSeedOppRatings.length > 0
      ? metrics.topSeedOppRatings.reduce((a, b) => a + b, 0) / metrics.topSeedOppRatings.length
      : 0,
  };
}

/**
 * Update player state from round results
 * This simulates what calculateStandings would do
 */
function updatePlayerState(players, round, results) {
  const playerMap = new Map(players.map(p => [p.id, { ...p }]));

  for (const pairing of round.pairings || []) {
    if (pairing.isBye) {
      const player = playerMap.get(pairing.player1.id);
      if (player) {
        player.score = (player.score || 0) + 1;
        player.colorHistory = [...(player.colorHistory || []), 'white'];
        player.colorBalance = (player.colorBalance || 0) + 1;
      }
      continue;
    }

    if (!pairing.player1 || !pairing.player2) continue;

    const p1 = playerMap.get(pairing.player1.id);
    const p2 = playerMap.get(pairing.player2.id);
    if (!p1 || !p2) continue;

    const result1 = results[p1.id];
    const result2 = results[p2.id];

    if (result1 && result2) {
      p1.score = (p1.score || 0) + result1.score;
      p2.score = (p2.score || 0) + result2.score;

      // Update color history
      if (pairing.whitePlayerId === p1.id) {
        p1.colorHistory = [...(p1.colorHistory || []), 'white'];
        p2.colorHistory = [...(p2.colorHistory || []), 'black'];
        p1.colorBalance = (p1.colorBalance || 0) + 1;
        p2.colorBalance = (p2.colorBalance || 0) - 1;
      } else {
        p1.colorHistory = [...(p1.colorHistory || []), 'black'];
        p2.colorHistory = [...(p2.colorHistory || []), 'white'];
        p1.colorBalance = (p1.colorBalance || 0) - 1;
        p2.colorBalance = (p2.colorBalance || 0) + 1;
      }

      // Update previous opponents
      p1.previousOpponents = [...(p1.previousOpponents || []), p2.id];
      p2.previousOpponents = [...(p2.previousOpponents || []), p1.id];
    }
  }

  return Array.from(playerMap.values());
}

/**
 * Main tournament runner
 */
function runTournament({ generatePairings, players, rounds, seed, resultFn, allPlayers = null, totalRounds = null }) {
  const state = {
    players: structuredClone(players).map(p => ({
      ...p,
      score: 0,
      colorBalance: 0,
      colorHistory: [],
      previousOpponents: [],
    })),
    roundsCompleted: 0,
    seed,
  };
  const allRounds = [];
  const tournamentRounds = [];

  for (let r = 1; r <= rounds; r++) {
    // Prepare players for this round
    const playersForRound = state.players.map(p => ({
      id: p.id,
      name: p.name,
      rating: p.rating || null,
      pairingNumber: p.pairingNumber || null,
      score: p.score || 0,
      colorBalance: p.colorBalance || 0,
      colorHistory: p.colorHistory || [],
      previousOpponents: p.previousOpponents || [],
    }));

    // Generate pairings
    let pairing;
    if (totalRounds !== null && generatePairings.length >= 5) {
      // Accelerated pairing needs totalRounds
      pairing = generatePairings(playersForRound, r, allPlayers || players, tournamentRounds, totalRounds);
    } else if (generatePairings.length === 2) {
      // Round robin only takes players and roundNumber
      pairing = generatePairings(playersForRound, r);
    } else {
      pairing = generatePairings(playersForRound, r, allPlayers || players, tournamentRounds);
    }

    // Normalize pairing format (round robin returns array directly, swiss returns object)
    const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);
    const pairingObj = Array.isArray(pairing) ? { pairings: pairing } : pairing;

    // Apply results deterministically
    const results = resultFn({ round: r, pairing: pairingObj, state, seed });

    // Update state from results
    applyResults(pairingObj, results);
    const round = {
      roundNumber: r,
      pairings: pairings,
      forcedRepeat: pairingObj.forcedRepeat || false,
      repeatCount: pairingObj.repeatCount || 0,
      completed: true,
    };
    tournamentRounds.push(round);

    // Update player state
    state.players = updatePlayerState(state.players, round, results);
    state.roundsCompleted++;

    allRounds.push({ r, pairing: pairingObj, results, round });
  }

  return { state, allRounds, metrics: calculateMetrics({ state, allRounds, players }) };
}

/**
 * Hard invariant assertions
 */
function assertHardInvariants({ pairing, roundNumber, players }) {
  const errors = [];
  const playerIds = new Set();
  const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);
  const isOdd = players.length % 2 === 1;
  let byeCount = 0;

  for (const p of pairings) {
    if (p.isBye) {
      byeCount++;
      if (p.player1) playerIds.add(p.player1.id);
      continue;
    }

    if (!p.player1 || !p.player2) {
      errors.push(`Round ${roundNumber}: Pairing missing player(s)`);
      continue;
    }

    // Check distinct players
    if (p.player1.id === p.player2.id) {
      errors.push(`Round ${roundNumber}: Player ${p.player1.id} paired with themselves`);
    }

    // Check no duplicate in round
    if (playerIds.has(p.player1.id)) {
      errors.push(`Round ${roundNumber}: Player ${p.player1.id} appears twice`);
    }
    if (playerIds.has(p.player2.id)) {
      errors.push(`Round ${roundNumber}: Player ${p.player2.id} appears twice`);
    }

    playerIds.add(p.player1.id);
    playerIds.add(p.player2.id);
  }

  // Check bye count
  if (isOdd && byeCount !== 1) {
    errors.push(`Round ${roundNumber}: Expected 1 bye for odd N, got ${byeCount}`);
  }
  if (!isOdd && byeCount !== 0) {
    errors.push(`Round ${roundNumber}: Expected 0 byes for even N, got ${byeCount}`);
  }

  // Check all players are paired
  if (playerIds.size !== players.length) {
    const missing = players.filter(p => !playerIds.has(p.id)).map(p => p.id);
    errors.push(`Round ${roundNumber}: Missing players: ${missing.join(', ')}`);
  }

  return errors;
}

/**
 * Check for repeats
 */
function checkRepeats({ pairing, previousOpponents }) {
  const errors = [];
  const warnings = [];
  const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);
  const playedPairs = new Set();

  // Build played pairs from previous opponents
  for (const player of previousOpponents || []) {
    for (const oppId of player.previousOpponents || []) {
      playedPairs.add(pairKey(player.id, oppId));
    }
  }

  for (const p of pairings) {
    if (p.isBye || !p.player1 || !p.player2) continue;

    const key = pairKey(p.player1.id, p.player2.id);
    if (playedPairs.has(key)) {
      if (pairing.forcedRepeat) {
        warnings.push(`Repeat pairing ${p.player1.id}-${p.player2.id} (forced)`);
      } else {
        errors.push(`Repeat pairing ${p.player1.id}-${p.player2.id} without forcedRepeat=true`);
      }
    }
  }

  return { errors, warnings };
}

module.exports = {
  runTournament,
  makeRandomPlayers,
  seededRandomResults,
  assertHardInvariants,
  checkRepeats,
  calculateMetrics,
  pairKey,
};
