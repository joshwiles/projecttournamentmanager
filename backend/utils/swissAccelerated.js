const { generateSwissRound, compareIds } = require('./swissEngine');

class SwissAccelerated {
  static generatePairings(players, roundNumber, allPlayers = null, rounds = [], totalRounds = 0) {
    const seedingPool = allPlayers && allPlayers.length ? allPlayers : players;
    const seeded = [...seedingPool].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return compareIds(a.id, b.id);
    });

    const topCount = Math.ceil(seeded.length / 2);
    const topIds = new Set(seeded.slice(0, topCount).map((player) => player.id));

    const k = Math.min(2, Math.floor((totalRounds || 0) / 3));
    const acceleratedRound = roundNumber <= k;

    return generateSwissRound(players, roundNumber, rounds, {
      getScore: (player) => {
        if (!acceleratedRound) {
          return player.score;
        }
        return player.score + (topIds.has(player.id) ? 1 : 0);
      },
      topBottomWeight: 10,
    });
  }
}

module.exports = SwissAccelerated;
