const { generateSwissRound } = require('./swissEngine');

class SwissFideDutch {
  static generatePairings(players, roundNumber, allPlayers = null, rounds = []) {
    return generateSwissRound(players, roundNumber, rounds, {
      getScore: (player) => player.score,
      topBottomWeight: 10,
    });
  }
}

module.exports = SwissFideDutch;
