/**
 * Round Robin Tournament Pairing Algorithm
 * 
 * Implements official US Chess Round Robin rules (30):
 * - All-play-all format
 * - Players assigned numbers by lot
 * - Uses Crenshaw tables for pairings
 * - Supports single and double round robin
 * - Handles color equalization
 */

class RoundRobinPairing {
  /**
   * Generate round robin pairings for a round
   * Uses Crenshaw tables (also known as Berger tables)
   * 
   * @param {Array} players - Array of player objects with {id, name, rating, pairingNumber}
   * @param {number} roundNumber - Current round number
   * @param {boolean} isDoubleRoundRobin - If true, generate second half pairings
   * @returns {Array} Array of pairings [{player1, player2, boardNumber}]
   */
  static generatePairings(players, roundNumber, isDoubleRoundRobin = false) {
    if (players.length < 2) {
      return [];
    }

    const numPlayers = players.length;
    const isOdd = numPlayers % 2 === 1;
    const numRounds = isOdd ? numPlayers : numPlayers - 1;
    
    // Adjust round number for double round robin
    let adjustedRound = roundNumber;
    if (isDoubleRoundRobin && roundNumber > numRounds) {
      adjustedRound = roundNumber - numRounds;
    }

    // Sort players by pairing number (assigned by lot)
    const sortedPlayers = [...players].sort((a, b) => {
      const numA = a.pairingNumber || a.id;
      const numB = b.pairingNumber || b.id;
      return numA - numB;
    });

    const pairings = [];

    if (isOdd) {
      // Odd number of players - one gets a bye each round
      const byePlayer = this.getByePlayer(sortedPlayers, adjustedRound, numRounds);
      const activePlayers = sortedPlayers.filter(p => p.id !== byePlayer.id);
      
      // Generate pairings for active players
      const activePairings = this.generateRoundRobinPairings(
        activePlayers,
        adjustedRound,
        isDoubleRoundRobin && roundNumber > numRounds
      );
      
      pairings.push(...activePairings);
      
      // Add bye
      pairings.push({
        player1: { id: byePlayer.id, name: byePlayer.name, rating: byePlayer.rating || null },
        player2: null,
        whitePlayerId: byePlayer.id,
        blackPlayerId: null,
        isBye: true,
      });
    } else {
      // Even number of players
      const roundPairings = this.generateRoundRobinPairings(
        sortedPlayers,
        adjustedRound,
        isDoubleRoundRobin && roundNumber > numRounds
      );
      pairings.push(...roundPairings);
    }

    // Assign board numbers
    pairings.forEach((pairing, index) => {
      pairing.boardNumber = index + 1;
    });

    return pairings;
  }

  /**
   * Generate round robin pairings using Crenshaw/Berger tables
   * For even number of players, uses standard round robin algorithm
   */
  static generateRoundRobinPairings(players, roundNumber, reverseColors = false) {
    const numPlayers = players.length;
    const numRounds = numPlayers - 1;
    const pairings = [];

    // Crenshaw/Berger table algorithm
    // Player 1 stays fixed, others rotate
    const fixedPlayer = players[0];
    const rotatingPlayers = players.slice(1);

    // Calculate rotation for this round
    const rotation = (roundNumber - 1) % numRounds;
    
    // Rotate the players array
    const rotatedPlayers = [...rotatingPlayers];
    for (let i = 0; i < rotation; i++) {
      rotatedPlayers.push(rotatedPlayers.shift());
    }

    // Pair fixed player with first rotated player
    const firstPair = this.assignColorsForPairing(
      fixedPlayer,
      rotatedPlayers[0],
      roundNumber,
      reverseColors
    );
    pairings.push(firstPair);

    // Pair remaining players (second with last, third with second-to-last, etc.)
    for (let i = 1; i < Math.floor(numPlayers / 2); i++) {
      const player1 = rotatedPlayers[i];
      const player2 = rotatedPlayers[numPlayers - 1 - i];
      const pair = this.assignColorsForPairing(
        player1,
        player2,
        roundNumber,
        reverseColors
      );
      pairings.push(pair);
    }

    return pairings;
  }

  /**
   * Assign colors for a pairing
   * In round robin, colors alternate based on round and player positions
   */
  static assignColorsForPairing(player1, player2, roundNumber, reverseColors = false) {
    // Use pairing numbers to determine initial color assignment
    const num1 = player1.pairingNumber || player1.id;
    const num2 = player2.pairingNumber || player2.id;
    
    // In round robin, higher pairing number typically gets white in first round
    // Colors alternate based on round number
    let player1IsWhite = false;
    
    if (!reverseColors) {
      // First half: alternate based on round and pairing numbers
      if (roundNumber % 2 === 1) {
        player1IsWhite = num1 > num2;
      } else {
        player1IsWhite = num1 < num2;
      }
    } else {
      // Second half (double round robin): reverse colors
      if (roundNumber % 2 === 1) {
        player1IsWhite = num1 < num2;
      } else {
        player1IsWhite = num1 > num2;
      }
    }

    if (player1IsWhite) {
      return {
        player1: { id: player1.id, name: player1.name, rating: player1.rating || null },
        player2: { id: player2.id, name: player2.name, rating: player2.rating || null },
        whitePlayerId: player1.id,
        blackPlayerId: player2.id,
      };
    } else {
      return {
        player1: { id: player2.id, name: player2.name, rating: player2.rating || null },
        player2: { id: player1.id, name: player1.name, rating: player1.rating || null },
        whitePlayerId: player2.id,
        blackPlayerId: player1.id,
      };
    }
  }

  /**
   * Get the player who gets a bye in this round (for odd number of players)
   */
  static getByePlayer(players, roundNumber, numRounds) {
    // Bye rotates through players
    // Player with pairing number equal to round number gets bye
    // If round > numPlayers, wrap around
    const byeIndex = (roundNumber - 1) % players.length;
    return players[byeIndex];
  }

  /**
   * Calculate number of rounds needed for round robin
   */
  static calculateRounds(numPlayers, isDoubleRoundRobin = false) {
    if (numPlayers < 2) return 0;
    const baseRounds = numPlayers % 2 === 1 ? numPlayers : numPlayers - 1;
    return isDoubleRoundRobin ? baseRounds * 2 : baseRounds;
  }

  /**
   * Assign pairing numbers to players (by lot)
   * In practice, this would be random, but we'll use a deterministic method
   */
  static assignPairingNumbers(players) {
    // Shuffle players to assign pairing numbers
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    return shuffled.map((player, index) => ({
      ...player,
      pairingNumber: index + 1,
    }));
  }

  /**
   * Calculate standings from tournament data (same as Swiss for scoring)
   */
  static calculateStandings(tournament) {
    const players = tournament.players.map(p => ({
      ...p,
      score: 0,
      colorBalance: 0,
      colorHistory: [],
      previousOpponents: [],
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
    }));

    // Process all completed rounds
    for (const round of tournament.rounds || []) {
      if (!round.completed) continue;

      for (const pairing of round.pairings || []) {
        if (pairing.isBye) {
          const player = players.find(p => p.id === pairing.player1.id);
          if (player) {
            player.score += 1; // Bye = win
            player.wins += 1;
            player.gamesPlayed += 1;
            player.colorHistory.push('white'); // Bye gets white
          }
          continue;
        }

        const player1 = players.find(p => p.id === pairing.player1.id);
        const player2 = players.find(p => p.id === pairing.player2.id);

        if (!player1 || !player2) continue;

        // Record opponents
        player1.previousOpponents.push(player2.id);
        player2.previousOpponents.push(player1.id);

        // Update color balance and history
        if (pairing.whitePlayerId === player1.id) {
          player1.colorBalance += 1;
          player2.colorBalance -= 1;
          player1.colorHistory.push('white');
          player2.colorHistory.push('black');
        } else {
          player1.colorBalance -= 1;
          player2.colorBalance += 1;
          player1.colorHistory.push('black');
          player2.colorHistory.push('white');
        }

        // Update scores based on result
        if (pairing.result) {
          player1.gamesPlayed += 1;
          player2.gamesPlayed += 1;

          if (pairing.result === '1-0') {
            player1.score += 1;
            player1.wins += 1;
            player2.losses += 1;
          } else if (pairing.result === '0-1') {
            player2.score += 1;
            player2.wins += 1;
            player1.losses += 1;
          } else if (pairing.result === '1/2-1/2') {
            player1.score += 0.5;
            player2.score += 0.5;
            player1.draws += 1;
            player2.draws += 1;
          }
        }
      }
    }

    // Sort by score (descending), then by rating, then by color balance
    players.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return b.colorBalance - a.colorBalance;
    });

    return players.map((p, index) => ({
      rank: index + 1,
      id: p.id,
      name: p.name,
      rating: p.rating || null,
      pairingNumber: p.pairingNumber || null,
      score: p.score,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      gamesPlayed: p.gamesPlayed,
      colorBalance: p.colorBalance,
      colorHistory: p.colorHistory || [],
      previousOpponents: p.previousOpponents || [],
    }));
  }
}

module.exports = RoundRobinPairing;

