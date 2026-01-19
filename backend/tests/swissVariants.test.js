const SwissPairing = require('../utils/swissPairing');
const SwissUSCF = require('../utils/swissUscf');
const SwissFideDutch = require('../utils/swissFideDutch');
const SwissAccelerated = require('../utils/swissAccelerated');

const buildPlayers = (count) =>
  Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `Player ${idx + 1}`,
    rating: 2000 - idx * 10,
  }));

const buildTournament = (players, numberOfRounds = 5) => ({
  players,
  rounds: [],
  numberOfRounds,
});

const completeRound = (round) => {
  round.pairings.forEach((pairing, index) => {
    if (pairing.isBye) {
      return;
    }
    if (index % 3 === 0) {
      pairing.result = '1-0';
    } else if (index % 3 === 1) {
      pairing.result = '0-1';
    } else {
      pairing.result = '1/2-1/2';
    }
  });
  round.completed = true;
};

const getPlayersForNextRound = (tournament) => {
  const standings = SwissPairing.calculateStandings(tournament);
  return tournament.players.map((p) => {
    const standing = standings.find((s) => s.id === p.id);
    return {
      id: p.id,
      name: p.name,
      rating: p.rating || null,
      pairingNumber: p.pairingNumber || null,
      score: standing ? standing.score : 0,
      colorBalance: standing ? standing.colorBalance : 0,
      colorHistory: standing ? standing.colorHistory || [] : [],
      previousOpponents: standing ? standing.previousOpponents || [] : [],
    };
  });
};

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const roundPairs = (round) =>
  new Set(
    round.pairings
      .filter((p) => !p.isBye && p.player1 && p.player2)
      .map((p) => pairKey(p.player1.id, p.player2.id))
  );

const runRound = (engine, tournament, roundNumber) => {
  const players = getPlayersForNextRound(tournament);
  let result;
  if (engine === SwissAccelerated) {
    result = engine.generatePairings(
      players,
      roundNumber,
      tournament.players,
      tournament.rounds,
      tournament.numberOfRounds
    );
  } else {
    result = engine.generatePairings(players, roundNumber, tournament.players, tournament.rounds);
  }

  const round = {
    roundNumber,
    pairings: result.pairings,
    forcedRepeat: result.forcedRepeat,
    repeatCount: result.repeatCount,
    notes: result.notes,
    completed: false,
  };
  tournament.rounds.push(round);
  completeRound(round);
  return round;
};

describe('Swiss variant pairing constraints', () => {
  const variants = [
    { name: 'USCF', engine: SwissUSCF },
    { name: 'FIDE Dutch', engine: SwissFideDutch },
    { name: 'Accelerated', engine: SwissAccelerated },
  ];

  test('No consecutive repeat pairing', () => {
    for (const variant of variants) {
      const tournament = buildTournament(buildPlayers(8), 5);
      for (let roundNumber = 1; roundNumber <= 5; roundNumber += 1) {
        const round = runRound(variant.engine, tournament, roundNumber);
        if (roundNumber > 1) {
          const currentPairs = roundPairs(round);
          const previousPairs = roundPairs(tournament.rounds[roundNumber - 2]);
          for (const pair of currentPairs) {
            if (previousPairs.has(pair)) {
              expect(round.forcedRepeat).toBe(true);
            }
          }
        }
        if (!round.forcedRepeat) {
          const seen = new Set();
          for (const priorRound of tournament.rounds) {
            for (const pair of roundPairs(priorRound)) {
              expect(seen.has(pair)).toBe(false);
              seen.add(pair);
            }
          }
        }
      }
    }
  });

  test('Repeat only when mathematically forced', () => {
    for (const variant of variants) {
      const tournament = buildTournament(buildPlayers(4), 4);
      for (let roundNumber = 1; roundNumber <= 4; roundNumber += 1) {
        runRound(variant.engine, tournament, roundNumber);
      }
      const finalRound = tournament.rounds[3];
      expect(finalRound.forcedRepeat).toBe(true);
      expect(finalRound.repeatCount).toBe(2);
      expect(finalRound.notes.forcedRepeatReason).toBe('no-repeat unsatisfiable');
    }
  });

  test('Accelerated Swiss changes early pairings but not standings', () => {
    const players = buildPlayers(8);
    const fideTournament = buildTournament(players, 6);
    const accelTournament = buildTournament(players, 6);

    const fideRound = runRound(SwissFideDutch, fideTournament, 1);
    const accelRound = runRound(SwissAccelerated, accelTournament, 1);

    const fidePairs = Array.from(roundPairs(fideRound)).sort();
    const accelPairs = Array.from(roundPairs(accelRound)).sort();

    expect(fidePairs).not.toEqual(accelPairs);

    const fideStandings = SwissPairing.calculateStandings(fideTournament);
    const accelStandings = SwissPairing.calculateStandings(accelTournament);

    const fideScores = fideStandings.map((p) => p.score).sort();
    const accelScores = accelStandings.map((p) => p.score).sort();

    expect(fideScores).toEqual(accelScores);
  });

  test('Byes go to lowest score without bye', () => {
    const tournament = buildTournament(buildPlayers(7), 4);
    const byeCounts = new Map();

    for (let roundNumber = 1; roundNumber <= 4; roundNumber += 1) {
      const players = getPlayersForNextRound(tournament);
      const standings = players.map((p) => ({
        id: p.id,
        score: p.score,
      }));

      const result = SwissUSCF.generatePairings(
        players,
        roundNumber,
        tournament.players,
        tournament.rounds
      );

      const byePairing = result.pairings.find((pairing) => pairing.isBye);
      expect(byePairing).toBeTruthy();

      const byeId = byePairing.player1.id;
      const alreadyHadBye = (byeCounts.get(byeId) || 0) > 0;
      if (!alreadyHadBye) {
        const noByePlayers = standings.filter((p) => (byeCounts.get(p.id) || 0) === 0);
        const lowestScore = Math.min(...noByePlayers.map((p) => p.score));
        const eligible = noByePlayers
          .filter((p) => p.score === lowestScore)
          .map((p) => p.id);
        expect(eligible).toContain(byeId);
      }

      const round = {
        roundNumber,
        pairings: result.pairings,
        forcedRepeat: result.forcedRepeat,
        repeatCount: result.repeatCount,
        notes: result.notes,
        completed: false,
      };
      tournament.rounds.push(round);
      completeRound(round);

      byeCounts.set(byeId, (byeCounts.get(byeId) || 0) + 1);
    }

    for (const count of byeCounts.values()) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });
});
