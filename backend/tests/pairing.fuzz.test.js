/**
 * Property/Fuzz Tests for Pairing Methods
 * 
 * Randomized tests that catch edge cases through extensive coverage
 * Run with: npm test -- pairing.fuzz.test.js
 */

const { runTournament, makeRandomPlayers, seededRandomResults, assertHardInvariants, checkRepeats, calculateMetrics } = require('./pairingHarness');
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
 * Format metrics for summary output
 */
function formatMetrics(name, metrics) {
  return `${name}: forcedRepeatRounds=${metrics.forcedRepeatRounds} ` +
    `avgGap=${metrics.avgScoreGap.toFixed(2)} ` +
    `maxGap=${metrics.maxScoreGap} ` +
    `maxStreak=${metrics.maxColorStreak} ` +
    `repeats=${metrics.repeatCount} ` +
    `consecRepeats=${metrics.consecutiveRepeatCount}`;
}

describe('Pairing Methods - Property/Fuzz Tests', () => {
  // Run fewer tests in CI, more locally
  const FUZZ_ITERATIONS = process.env.CI ? 50 : 200;
  const seeds = Array.from({ length: FUZZ_ITERATIONS }, (_, i) => 10000 + i);

  describe.each(methods)('%s fuzz invariants', (name, method) => {
    test.each(seeds)('seed %d - hard invariants', (seed) => {
      // Randomize tournament size
      const rng = seed;
      const next = () => {
        const r = (rng * 1103515245 + 12345) & 0x7fffffff;
        return r / 0x7fffffff;
      };

      const playerCount = 4 + Math.floor(next() * 17); // 4-20 players
      const isRoundRobin = name.includes('round_robin');
      const isDouble = name === 'double_round_robin';
      const maxRounds = isRoundRobin
        ? (isDouble ? (playerCount - 1) * 2 : playerCount - 1)
        : Math.min(10, playerCount - 1);
      const rounds = 1 + Math.floor(next() * maxRounds);

      const players = makeRandomPlayers(seed, playerCount);
      const totalRounds = isRoundRobin ? maxRounds : rounds;

      const generatePairings = (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
        if (isRoundRobin) {
          return method.generatePairings(players, roundNumber, isDouble);
        }
        if (name === 'swiss_accelerated') {
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || totalRounds);
        }
        return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
      };

      const { allRounds, state } = runTournament({
        generatePairings,
        players,
        rounds: totalRounds,
        seed,
        resultFn: seededRandomResults,
        allPlayers: players,
        totalRounds: isRoundRobin ? totalRounds : rounds,
      });

      // Assert hard invariants for every round
      for (const { r, pairing } of allRounds) {
        const errors = assertHardInvariants({ pairing, roundNumber: r, players });
        expect(errors).toEqual([]);
      }

      // Check repeat constraints (skip for round robin - it's deterministic)
      if (!name.includes('round_robin')) {
        let previousOpponents = players.map(p => ({ ...p, previousOpponents: [] }));
        for (const { r, pairing, round } of allRounds) {
          const { errors } = checkRepeats({ pairing, previousOpponents });
          expect(errors).toEqual([]);

          // Update previous opponents for next round
          if (round && round.pairings) {
            for (const p of round.pairings) {
              if (p.isBye || !p.player1 || !p.player2) continue;
              const p1 = previousOpponents.find(pl => pl.id === p.player1.id);
              const p2 = previousOpponents.find(pl => pl.id === p.player2.id);
              if (p1 && p2) {
                if (!p1.previousOpponents.includes(p2.id)) {
                  p1.previousOpponents.push(p2.id);
                }
                if (!p2.previousOpponents.includes(p1.id)) {
                  p2.previousOpponents.push(p1.id);
                }
              }
            }
          }
        }
      }

      // Verify scores are updated correctly
      for (const player of state.players) {
        let calculatedScore = 0;
        for (const { round } of allRounds) {
          if (!round || !round.pairings) continue;
          for (const p of round.pairings) {
            if (p.isBye && p.player1 && p.player1.id === player.id) {
              calculatedScore += 1;
            } else if (p.player1 && p.player1.id === player.id && p.result) {
              if (p.result === '1-0') calculatedScore += 1;
              else if (p.result === '1/2-1/2') calculatedScore += 0.5;
            } else if (p.player2 && p.player2.id === player.id && p.result) {
              if (p.result === '0-1') calculatedScore += 1;
              else if (p.result === '1/2-1/2') calculatedScore += 0.5;
            }
          }
        }
        expect(Math.abs(player.score - calculatedScore)).toBeLessThan(0.01);
      }
    });

    test('determinism: same seed produces identical pairings', () => {
      const seed = 50000;
      const players = makeRandomPlayers(seed, 10);
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

      const run1 = runTournament({
        generatePairings,
        players,
        rounds: totalRounds,
        seed,
        resultFn: seededRandomResults,
        allPlayers: players,
        totalRounds: isRoundRobin ? totalRounds : rounds,
      });

      const run2 = runTournament({
        generatePairings,
        players,
        rounds: totalRounds,
        seed,
        resultFn: seededRandomResults,
        allPlayers: players,
        totalRounds: isRoundRobin ? totalRounds : rounds,
      });

      // Compare pairings
      expect(run1.allRounds.length).toBe(run2.allRounds.length);
      for (let i = 0; i < run1.allRounds.length; i++) {
        const round1 = run1.allRounds[i].pairing.pairings || run1.allRounds[i].pairing;
        const round2 = run2.allRounds[i].pairing.pairings || run2.allRounds[i].pairing;

        expect(round1.length).toBe(round2.length);
        for (let j = 0; j < round1.length; j++) {
          const p1 = round1[j];
          const p2 = round2[j];

          if (p1.isBye) {
            expect(p2.isBye).toBe(true);
            expect(p1.player1.id).toBe(p2.player1.id);
          } else {
            expect(p1.player1.id).toBe(p2.player1.id);
            expect(p1.player2.id).toBe(p2.player2.id);
            expect(p1.whitePlayerId).toBe(p2.whitePlayerId);
            expect(p1.blackPlayerId).toBe(p2.blackPlayerId);
          }
        }
      }
    });
  });

  describe('Metrics comparison', () => {
    test('compare all methods on same tournament', () => {
      const seed = 60000;
      const players = makeRandomPlayers(seed, 12);
      const rounds = 6;

      const swissMethods = [
        ['swiss', SwissPairing],
        ['swiss_uscf', SwissUSCF],
        ['swiss_fide_dutch', SwissFideDutch],
        ['swiss_accelerated', SwissAccelerated],
      ];

      const results = [];
      for (const [name, method] of swissMethods) {
        const { metrics } = runTournament({
          generatePairings: (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
            if (name === 'swiss_accelerated') {
              return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
            }
            return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
          },
          players,
          rounds,
          seed,
          resultFn: seededRandomResults,
          allPlayers: players,
          totalRounds: rounds,
        });

        results.push({ name, metrics });
      }

      // Print summary (visible in test output)
      for (const { name, metrics } of results) {
        console.log(formatMetrics(name, metrics));
      }

      // All should have reasonable metrics
      for (const { name, metrics } of results) {
        expect(metrics.forcedRepeatRounds).toBeLessThan(rounds);
        expect(metrics.avgScoreGap).toBeLessThan(2.0); // Average gap should be small
        expect(metrics.maxColorStreak).toBeLessThan(4); // No more than 3 same colors in a row
      }
    });
  });

  describe('Edge cases', () => {
    test.each(methods)('%s: minimum players (2)', (name, method) => {
      const players = makeRandomPlayers(70000, 2);
      const rounds = 1;
      const isRoundRobin = name.includes('round_robin');

      const generatePairings = (players, roundNumber) => {
        if (isRoundRobin) {
          return method.generatePairings(players, roundNumber, name === 'double_round_robin');
        }
        if (name === 'swiss_accelerated') {
          return method.generatePairings(players, roundNumber, players, [], rounds);
        }
        return method.generatePairings(players, roundNumber, players, []);
      };

      const { allRounds } = runTournament({
        generatePairings,
        players,
        rounds,
        seed: 70000,
        resultFn: seededRandomResults,
        allPlayers: players,
        totalRounds: rounds,
      });

      expect(allRounds.length).toBe(rounds);
      const errors = assertHardInvariants({ pairing: allRounds[0].pairing, roundNumber: 1, players });
      expect(errors).toEqual([]);
    });

    test.each(methods)('%s: large tournament (20 players)', (name, method) => {
      const players = makeRandomPlayers(80000, 20);
      const rounds = name.includes('round_robin') ? (name === 'double_round_robin' ? 38 : 19) : 7;
      const isRoundRobin = name.includes('round_robin');
      const isDouble = name === 'double_round_robin';

      const generatePairings = (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
        if (isRoundRobin) {
          return method.generatePairings(players, roundNumber, isDouble);
        }
        if (name === 'swiss_accelerated') {
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
        }
        return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
      };

      const { allRounds } = runTournament({
        generatePairings,
        players,
        rounds,
        seed: 80000,
        resultFn: seededRandomResults,
        allPlayers: players,
        totalRounds: isRoundRobin ? rounds : rounds,
      });

      expect(allRounds.length).toBe(rounds);
      for (const { r, pairing } of allRounds) {
        const errors = assertHardInvariants({ pairing, roundNumber: r, players });
        expect(errors).toEqual([]);
      }
    });

    test.each(methods)('%s: odd number of players', (name, method) => {
      const players = makeRandomPlayers(90000, 9);
      const rounds = name.includes('round_robin') ? (name === 'double_round_robin' ? 18 : 9) : 5;
      const isRoundRobin = name.includes('round_robin');
      const isDouble = name === 'double_round_robin';

      const generatePairings = (players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam) => {
        if (isRoundRobin) {
          return method.generatePairings(players, roundNumber, isDouble);
        }
        if (name === 'swiss_accelerated') {
          return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds, totalRoundsParam || rounds);
        }
        return method.generatePairings(players, roundNumber, allPlayers, tournamentRounds);
      };

      const { allRounds } = runTournament({
        generatePairings,
        players,
        rounds,
        seed: 90000,
        resultFn: seededRandomResults,
        allPlayers: players,
        totalRounds: isRoundRobin ? rounds : rounds,
      });

      // Every round should have exactly one bye
      for (const { r, pairing } of allRounds) {
        const pairings = pairing.pairings || pairing;
        const byeCount = pairings.filter(p => p.isBye).length;
        expect(byeCount).toBe(1);
      }
    });
  });
});
