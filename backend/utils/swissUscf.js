const { generateSwissRound } = require('./swissEngine');

class SwissUSCF {
  static generatePairings(players, roundNumber, allPlayers = null, rounds = []) {
    return generateSwissRound(players, roundNumber, rounds, {
      getScore: (player) => player.score,
      topBottomWeight: 5,
    });
  }
}

module.exports = SwissUSCF;
