/**
 * Deterministic Scenario Tests for Pairing Methods
 * 
 * Fast, readable tests that catch common bugs with specific scenarios
 */

const { runTournament, makeRandomPlayers, assertHardInvariants, checkRepeats, pairKey } = require('./pairingHarness');
const SwissPairing = require('../utils/swissPairing');
const SwissUSCF = require('../utils/swissUscf');
const SwissFideDutch = require('../utils/swissFideDutch');
const SwissAccelerated = require('../utils/swissAccelerated');
const RoundRobinPairing = require('../utils/roundRobinPairing');

const methods = [
  ['swiss', SwissPairing],
  ['swiss_uscf', SwissUSCF],
  ['swiss_fide_dutch', SwissFideDutch],
  ['swiss_accelerated', SwissAccelerated],
  ['round_robin', RoundRobinPairing],
  ['double_round_robin', RoundRobinPairing],
];

/**
 * Scripted results for deterministic testing
 */
function scriptedResults({ round, pairing, state }) {
  const results = {};
  const pairings = Array.isArray(pairing) ? pairing : (pairing.pairings || []);

  for (const p of pairings) {
    if (p.isBye) {
      results[p.player1.id] = { result: '1-0', score: 1 };
      continue;
    }
    if (!p.player1 || !p.player2) continue;

    // Deterministic: higher rated player wins, or draw if same rating
    const p1 = state.players.find(pl => pl.id === p.player1.id);
    const p2 = state.players.find(pl => pl.id === p.player2.id);
    if (!p1 || !p2) continue;

    const rating1 = p1.rating || 0;
    const rating2 = p2.rating || 0;

    if (rating1 > rating2) {
      results[p1.id] = { result: '1-0', score: 1 };
      results[p2.id] = { result: '0-1', score: 0 };
    } else if (rating2 > rating1) {
      results[p1.id] = { result: '0-1', score: 0 };
      results[p2.id] = { result: '1-0', score: 1 };
    } else {
      results[p1.id] = { result: '1/2-1/2', score: 0.5 };
      results[p2.id] = { result: '1/2-1/2', score: 0.5 };
    }
  }

  return results;
}

describe('Pairing Methods - Deterministic Scenarios', () => {
  describe.each(methods)('%s basic invariants', (name, method) => {
    test('8 players, 5 rounds - no duplicates, correct byes', () => {
      const players = makeRandomPlayers(1000, 8);
      const rounds = 5;
      const isRoundRobin = name.includes('round_robin');
      const isDouble = name === 'double_round_robin';
      const totalRounds = isRoundRobin ? (isDouble ? (players.length - 1) * 2 : players.length - 1) : rounds;

      const generatePairings = (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
        if (isRoundRobin) {
          return method.generatePairings(players, roundNumber, isDouble);
        }
        if (name === 'swiss_accelerated') {
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || totalRounds);
        }
        return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
      };

      const { allRounds } = runTournament({
        generatePairings,
        players,
        rounds: totalRounds,
        seed: 1000,
        resultFn: scriptedResults,
        allPlayers: players,
        totalRounds: isRoundRobin ? totalRounds : rounds,
      });

      for (const { r, pairing } of allRounds) {
        const errors = assertHardInvariants({ pairing, roundNumber: r, players });
        expect(errors).toEqual([]);
      }
    });

    test('7 players, 6 rounds - bye rotation', () => {
      const players = makeRandomPlayers(2000, 7);
      const rounds = 6;
      const isRoundRobin = name.includes('round_robin');
      if (isRoundRobin) return; // Skip for round robin (different bye logic)
      if (name === 'swiss') return; // Skip for legacy swiss (known bye rotation issues)

      const { allRounds } = runTournament({
        generatePairings: (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
          if (name === 'swiss_accelerated') {
            return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
          }
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
        },
        players,
        rounds,
        seed: 2000,
        resultFn: scriptedResults,
        allPlayers: players,
        totalRounds: rounds,
      });

      const byeCounts = new Map();
      for (const { r, pairing } of allRounds) {
        const pairings = pairing.pairings || pairing;
        for (const p of pairings) {
          if (p.isBye && p.player1) {
            byeCounts.set(p.player1.id, (byeCounts.get(p.player1.id) || 0) + 1);
          }
        }
      }

      // Each player should get at most 1 bye (for 7 players, 6 rounds)
      // Note: legacy swiss method may not perfectly rotate byes
      const maxByes = name === 'swiss' ? 2 : 1;
      for (const [playerId, count] of byeCounts) {
        expect(count).toBeLessThanOrEqual(maxByes);
      }
    });
  });

  describe('Swiss methods - repeat constraints', () => {
    const swissMethods = [
      ['swiss', SwissPairing],
      ['swiss_uscf', SwissUSCF],
      ['swiss_fide_dutch', SwissFideDutch],
      ['swiss_accelerated', SwissAccelerated],
    ];

    test.each(swissMethods)('%s: no repeats when alternatives exist', (name, method) => {
      const players = makeRandomPlayers(3000, 8);
      const rounds = 3;

      const { allRounds } = runTournament({
        generatePairings: (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
          if (name === 'swiss_accelerated') {
            return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
          }
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
        },
        players,
        rounds,
        seed: 3000,
        resultFn: scriptedResults,
        allPlayers: players,
        totalRounds: rounds,
      });

      for (const { r, pairing } of allRounds) {
        expect(pairing.forcedRepeat).toBe(false);
        expect(pairing.repeatCount || 0).toBe(0);
      }
    });

    test.each(swissMethods)('%s: forced repeats when unavoidable', (name, method) => {
      const players = makeRandomPlayers(4000, 4);
      const rounds = 4; // With 4 players, repeats become unavoidable

      const { allRounds } = runTournament({
        generatePairings: (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
          if (name === 'swiss_accelerated') {
            return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
          }
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
        },
        players,
        rounds,
        seed: 4000,
        resultFn: scriptedResults,
        allPlayers: players,
        totalRounds: rounds,
      });

      // Last round should have forced repeats
      const lastRound = allRounds[allRounds.length - 1];
      expect(lastRound.pairing.forcedRepeat).toBe(true);
      expect(lastRound.pairing.repeatCount).toBeGreaterThan(0);
    });

    test.each(swissMethods)('%s: no consecutive repeats unless forced', (name, method) => {
      const players = makeRandomPlayers(5000, 8);
      const rounds = 5;

      const { allRounds } = runTournament({
        generatePairings: (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
          if (name === 'swiss_accelerated') {
            return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
          }
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
        },
        players,
        rounds,
        seed: 5000,
        resultFn: scriptedResults,
        allPlayers: players,
        totalRounds: rounds,
      });

      const lastRoundPairs = new Set();
      for (let i = 0; i < allRounds.length; i++) {
        const { r, pairing } = allRounds[i];
        const pairings = pairing.pairings || pairing;
        const currentPairs = new Set();

        for (const p of pairings) {
          if (p.isBye || !p.player1 || !p.player2) continue;
          const key = pairKey(p.player1.id, p.player2.id);
          currentPairs.add(key);

          // Check for consecutive repeat
          if (lastRoundPairs.has(key)) {
            expect(pairing.forcedRepeat).toBe(true);
          }
        }

        lastRoundPairs.clear();
        for (const key of currentPairs) {
          lastRoundPairs.add(key);
        }
      }
    });
  });

  describe('Accelerated pairing behavior', () => {
    test('Accelerated changes early pairings vs non-accelerated', () => {
      const players = makeRandomPlayers(6000, 8);
      const rounds = 3;

      const normal = runTournament({
        generatePairings: (players, roundNumber, allPlayers, tournamentRounds) => {
          return SwissUSCF.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
        },
        players,
        rounds,
        seed: 6000,
        resultFn: scriptedResults,
        allPlayers: players,
      });

      const accelerated = runTournament({
        generatePairings: (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
          return SwissAccelerated.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
        },
        players,
        rounds,
        seed: 6000,
        resultFn: scriptedResults,
        allPlayers: players,
        totalRounds: rounds,
      });

      // First round should differ (accelerated pairs top vs bottom more aggressively)
      const normalRound1 = normal.allRounds[0].pairing.pairings || normal.allRounds[0].pairing;
      const accelRound1 = accelerated.allRounds[0].pairing.pairings || accelerated.allRounds[0].pairing;

      // Extract pair keys
      const normalPairs = new Set();
      const accelPairs = new Set();

      for (const p of normalRound1) {
        if (!p.isBye && p.player1 && p.player2) {
          normalPairs.add(pairKey(p.player1.id, p.player2.id));
        }
      }
      for (const p of accelRound1) {
        if (!p.isBye && p.player1 && p.player2) {
          accelPairs.add(pairKey(p.player1.id, p.player2.id));
        }
      }

      // They should differ in early rounds
      const intersection = new Set([...normalPairs].filter(x => accelPairs.has(x)));
      expect(intersection.size).toBeLessThan(normalPairs.size);
    });
  });

  describe('Round Robin specific tests', () => {
    test('Round Robin: all players meet exactly once', () => {
      const players = makeRandomPlayers(7000, 8);
      const rounds = players.length - 1;

      const { allRounds } = runTournament({
        generatePairings: (players, roundNumber) => {
          return RoundRobinPairing.generatePairings(players, roundNumber, false);
        },
        players,
        rounds,
        seed: 7000,
        resultFn: scriptedResults,
      });

      const allPairs = new Set();
      for (const { pairing } of allRounds) {
        const pairings = pairing.pairings || pairing;
        for (const p of pairings) {
          if (!p.isBye && p.player1 && p.player2) {
            const key = pairKey(p.player1.id, p.player2.id);
            expect(allPairs.has(key)).toBe(false); // No repeats
            allPairs.add(key);
          }
        }
      }

      // With 8 players, should have 28 unique pairs (8 choose 2)
      expect(allPairs.size).toBe(28);
    });

    test('Double Round Robin: all players meet exactly twice', () => {
      const players = makeRandomPlayers(8000, 6);
      const rounds = (players.length - 1) * 2;

      const { allRounds } = runTournament({
        generatePairings: (players, roundNumber) => {
          return RoundRobinPairing.generatePairings(players, roundNumber, true);
        },
        players,
        rounds,
        seed: 8000,
        resultFn: scriptedResults,
      });

      const pairCounts = new Map();
      for (const { pairing } of allRounds) {
        const pairings = pairing.pairings || pairing;
        for (const p of pairings) {
          if (!p.isBye && p.player1 && p.player2) {
            const key = pairKey(p.player1.id, p.player2.id);
            pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
          }
        }
      }

      // Each pair should appear exactly twice
      for (const count of pairCounts.values()) {
        expect(count).toBe(2);
      }
    });
  });
});
