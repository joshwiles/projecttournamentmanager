const SwissPairing = require('../utils/swissPairing');

const buildPlayers = (count) =>
  Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `Player ${idx + 1}`,
    rating: 2000 - idx * 10,
  }));

const buildTournament = (players) => ({
  players,
  rounds: [],
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

describe('SwissPairing repeat constraints', () => {
  test('No consecutive repeat', () => {
    const tournament = buildTournament(buildPlayers(8));

    for (let roundNumber = 1; roundNumber <= 5; roundNumber += 1) {
      const players = getPlayersForNextRound(tournament);
      const pairingResult = SwissPairing.generatePairings(
        players,
        roundNumber,
        tournament.players,
        tournament.rounds
      );
      const round = {
        roundNumber,
        pairings: pairingResult.pairings,
        forcedRepeat: pairingResult.forcedRepeat,
        repeatCount: pairingResult.repeatCount,
        completed: false,
      };
      tournament.rounds.push(round);
      completeRound(round);

      if (roundNumber > 1) {
        const currentPairs = roundPairs(round);
        const previousPairs = roundPairs(tournament.rounds[roundNumber - 2]);
        for (const pair of currentPairs) {
          if (previousPairs.has(pair)) {
            expect(round.forcedRepeat).toBe(true);
          }
        }
      }
    }
  });

  test('No repeats when alternatives exist', () => {
    const tournament = buildTournament(buildPlayers(8));
    const allPairs = new Set();

    for (let roundNumber = 1; roundNumber <= 3; roundNumber += 1) {
      const players = getPlayersForNextRound(tournament);
      const pairingResult = SwissPairing.generatePairings(
        players,
        roundNumber,
        tournament.players,
        tournament.rounds
      );
      expect(pairingResult.forcedRepeat).toBe(false);
      expect(pairingResult.repeatCount).toBe(0);

      const round = {
        roundNumber,
        pairings: pairingResult.pairings,
        forcedRepeat: pairingResult.forcedRepeat,
        repeatCount: pairingResult.repeatCount,
        completed: false,
      };
      tournament.rounds.push(round);
      completeRound(round);

      for (const pair of roundPairs(round)) {
        expect(allPairs.has(pair)).toBe(false);
        allPairs.add(pair);
      }
    }
  });

  test('Repeat only when forced', () => {
    const tournament = buildTournament(buildPlayers(4));

    for (let roundNumber = 1; roundNumber <= 4; roundNumber += 1) {
      const players = getPlayersForNextRound(tournament);
      const pairingResult = SwissPairing.generatePairings(
        players,
        roundNumber,
        tournament.players,
        tournament.rounds
      );
      const round = {
        roundNumber,
        pairings: pairingResult.pairings,
        forcedRepeat: pairingResult.forcedRepeat,
        repeatCount: pairingResult.repeatCount,
        completed: false,
      };
      tournament.rounds.push(round);
      completeRound(round);
    }

    const finalRound = tournament.rounds[3];
    expect(finalRound.forcedRepeat).toBe(true);
    expect(finalRound.repeatCount).toBe(2);
  });

  test('Score gap minimized', () => {
    const scores = [3, 3, 2, 2, 1, 1, 0, 0];
    const players = scores.map((score, idx) => ({
      id: idx + 1,
      name: `Player ${idx + 1}`,
      rating: 2000 - idx * 10,
      score,
      colorBalance: 0,
      colorHistory: [],
      previousOpponents: [],
    }));

    const pairingResult = SwissPairing.generatePairings(players, 1, players, []);
    expect(pairingResult.forcedRepeat).toBe(false);

    const scoreMap = new Map(players.map((p) => [p.id, p.score]));
    for (const pairing of pairingResult.pairings) {
      const score1 = scoreMap.get(pairing.player1.id);
      const score2 = scoreMap.get(pairing.player2.id);
      expect(Math.abs(score1 - score2)).toBe(0);
    }
  });
});
