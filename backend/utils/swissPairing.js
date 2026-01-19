/**
 * Swiss System Tournament Pairing Algorithm
 * 
 * Implements official US Chess Swiss System rules (27A):
 * 27A1. Avoid players meeting twice (highest priority)
 * 27A2. Equal scores
 * 27A3. Upper half vs. lower half (within score groups)
 * 27A4. Equalizing colors (not more than 2 of same color in a row)
 * 27A5. Alternating colors
 */

class SwissPairing {
  /**
   * Generate pairings for a round
   * @param {Array} players - Array of player objects with {id, name, rating, score, colorBalance, previousOpponents, colorHistory}
   * @param {number} roundNumber - Current round number
   * @param {Array} allPlayers - All players in tournament (for pairing numbers)
   * @param {Array} rounds - Completed/created rounds for repeat detection
   * @returns {{pairings: Array, forcedRepeat: boolean, repeatCount: number}} Pairings and repeat metadata
   */
  static generatePairings(players, roundNumber, allPlayers = null, rounds = []) {
    if (players.length < 2) {
      return { pairings: [], forcedRepeat: false, repeatCount: 0 };
    }

    const { playedPairs, opponentsMap } = this.buildPlayedPairs(players);
    const lastRoundPairs = this.getLastRoundPairs(rounds, roundNumber);

    // Create pairing number map if allPlayers provided
    const pairingNumberMap = new Map();
    if (allPlayers) {
      // Rank all players by rating (descending), then by ID
      const ranked = [...allPlayers].sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return a.id - b.id;
      });
      ranked.forEach((p, index) => {
        pairingNumberMap.set(p.id, index + 1);
      });
    }

    // Sort players by score (descending), then by rating, then by ID
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Within same score, rank by rating (higher rating = better)
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      // If same rating, use pairing number or ID
      const pairNumA = pairingNumberMap.get(a.id) || a.id;
      const pairNumB = pairingNumberMap.get(b.id) || b.id;
      return pairNumB - pairNumA;
    });

    const hasBye = sortedPlayers.length % 2 === 1;
    let byePlayer = null;
    let pairingPool = [...sortedPlayers];

    if (hasBye) {
      byePlayer = pairingPool[pairingPool.length - 1];
      pairingPool = pairingPool.slice(0, -1);
    }

    const noRepeatResult = this.findBestPairings(pairingPool, {
      roundNumber,
      playedPairs,
      opponentsMap,
      lastRoundPairs,
      allowRepeats: false,
    });

    let pairingResult = noRepeatResult;
    let forcedRepeat = false;

    if (!pairingResult) {
      pairingResult = this.findBestPairings(pairingPool, {
        roundNumber,
        playedPairs,
        opponentsMap,
        lastRoundPairs,
        allowRepeats: true,
      });
      forcedRepeat = true;

      const repeatCount = pairingResult ? pairingResult.repeatCount : 0;
      console.warn(
        `[SwissPairing] Round ${roundNumber}: no-repeat unsatisfiable, forced repeats=${repeatCount}`
      );
    }

    const pairings = [];
    let boardNumber = 1;

    if (pairingResult) {
      for (const pair of pairingResult.pairs) {
        pairings.push({
          player1: { id: pair.white.id, name: pair.white.name, rating: pair.white.rating || null },
          player2: { id: pair.black.id, name: pair.black.name, rating: pair.black.rating || null },
          boardNumber: boardNumber++,
          whitePlayerId: pair.white.id,
          blackPlayerId: pair.black.id,
          isRepeat: pair.isRepeat,
        });
      }
    }

    if (hasBye && byePlayer) {
      pairings.push({
        player1: { id: byePlayer.id, name: byePlayer.name, rating: byePlayer.rating || null },
        player2: null,
        boardNumber: boardNumber,
        whitePlayerId: byePlayer.id,
        blackPlayerId: null,
        isBye: true,
      });
    }

    return {
      pairings,
      forcedRepeat,
      repeatCount: pairingResult ? pairingResult.repeatCount : 0,
    };
  }

  static pairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  static buildPlayedPairs(players) {
    // Canonical pair tracking (frozen set via sorted "a|b" key)
    const playedPairs = new Set();
    const opponentsMap = new Map();

    for (const player of players) {
      const opps = new Set(player.previousOpponents || []);
      opponentsMap.set(player.id, opps);
      for (const oppId of opps) {
        playedPairs.add(this.pairKey(player.id, oppId));
      }
    }

    return { playedPairs, opponentsMap };
  }

  static isRepeat(playerA, playerB, playedPairs) {
    return playedPairs.has(this.pairKey(playerA.id, playerB.id));
  }

  static availableOpponents(player, candidates, playedPairs, allowRepeats, opponentsMap) {
    if (allowRepeats) {
      return candidates;
    }
    const opponents = opponentsMap ? opponentsMap.get(player.id) : null;
    return candidates.filter(candidate => {
      if (opponents && opponents.has(candidate.id)) {
        return false;
      }
      return !this.isRepeat(player, candidate, playedPairs);
    });
  }

  static getLastRoundPairs(rounds, roundNumber) {
    if (!rounds || roundNumber <= 1) {
      return new Set();
    }
    const priorRounds = rounds
      .filter(r => r.roundNumber < roundNumber)
      .sort((a, b) => b.roundNumber - a.roundNumber);
    const lastRound = priorRounds[0];
    if (!lastRound || !lastRound.pairings) {
      return new Set();
    }
    const pairSet = new Set();
    for (const pairing of lastRound.pairings) {
      if (pairing.isBye || !pairing.player1 || !pairing.player2) {
        continue;
      }
      pairSet.add(this.pairKey(pairing.player1.id, pairing.player2.id));
    }
    return pairSet;
  }

  static findBestPairings(players, options) {
    if (players.length === 0) {
      return { pairs: [], cost: 0, repeatCount: 0 };
    }

    const {
      roundNumber,
      playedPairs,
      opponentsMap,
      lastRoundPairs,
      allowRepeats,
    } = options;

    let best = null;

    const backtrack = (remaining, currentPairs, cost, repeatCount) => {
      if (remaining.length === 0) {
        if (!best) {
          best = { pairs: currentPairs, cost, repeatCount };
          return;
        }
        if (allowRepeats) {
          if (repeatCount < best.repeatCount || (repeatCount === best.repeatCount && cost < best.cost)) {
            best = { pairs: currentPairs, cost, repeatCount };
          }
        } else if (cost < best.cost) {
          best = { pairs: currentPairs, cost, repeatCount };
        }
        return;
      }

      let bestIndex = 0;
      let bestOpponentCount = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const candidatePool = remaining.filter((_, idx) => idx !== i);
        const available = this.availableOpponents(
          remaining[i],
          candidatePool,
          playedPairs,
          allowRepeats,
          opponentsMap
        );
        if (available.length < bestOpponentCount) {
          bestOpponentCount = available.length;
          bestIndex = i;
        }
      }

      const player = remaining[bestIndex];
      const rest = remaining.filter((_, idx) => idx !== bestIndex);
      const available = this.availableOpponents(
        player,
        rest,
        playedPairs,
        allowRepeats,
        opponentsMap
      );

      if (available.length === 0) {
        return;
      }

      const candidatePairs = available.map(opponent => {
        const isRepeat = this.isRepeat(player, opponent, playedPairs);
        const isConsecutiveRepeat = lastRoundPairs.has(this.pairKey(player.id, opponent.id));
        const { white, black } = this.assignColors(player, opponent, roundNumber);
        const pairCost = this.calculatePairingCost(player, opponent, {
          roundNumber,
          isRepeat,
          isConsecutiveRepeat,
        });
        return { opponent, white, black, isRepeat, pairCost };
      });

      candidatePairs.sort((a, b) => {
        if (a.pairCost !== b.pairCost) {
          return a.pairCost - b.pairCost;
        }
        if (a.opponent.id !== b.opponent.id) {
          return a.opponent.id - b.opponent.id;
        }
        return 0;
      });

      for (const candidate of candidatePairs) {
        const nextRepeatCount = repeatCount + (candidate.isRepeat ? 1 : 0);
        const nextCost = cost + candidate.pairCost;

        if (best) {
          if (allowRepeats) {
            if (nextRepeatCount > best.repeatCount) {
              continue;
            }
            if (nextRepeatCount === best.repeatCount && nextCost >= best.cost) {
              continue;
            }
          } else if (nextCost >= best.cost) {
            continue;
          }
        }

        const nextRemaining = rest.filter(p => p.id !== candidate.opponent.id);
        backtrack(
          nextRemaining,
          [
            ...currentPairs,
            {
              white: candidate.white,
              black: candidate.black,
              isRepeat: candidate.isRepeat,
            },
          ],
          nextCost,
          nextRepeatCount
        );
      }
    };

    backtrack(players, [], 0, 0);
    return best;
  }

  static calculatePairingCost(player1, player2, context) {
    const SCORE_GAP_WEIGHT = 1000;
    const COLOR_BALANCE_WEIGHT = 10;
    const STREAK_WEIGHT = 500;
    const REPEAT_WEIGHT = 1000000;
    const CONSECUTIVE_REPEAT_WEIGHT = 10000000;

    const { roundNumber, isRepeat, isConsecutiveRepeat } = context;

    let cost = 0;

    const scoreGap = Math.abs(player1.score - player2.score);
    cost += scoreGap * SCORE_GAP_WEIGHT;

    const colorBalanceGap = Math.abs(player1.colorBalance + player2.colorBalance);
    cost += colorBalanceGap * COLOR_BALANCE_WEIGHT;

    const { white, black } = this.assignColors(player1, player2, roundNumber);
    if (this.wouldCreateThreeSame(white, 'white')) {
      cost += STREAK_WEIGHT;
    }
    if (this.wouldCreateThreeSame(black, 'black')) {
      cost += STREAK_WEIGHT;
    }

    if (isRepeat) {
      cost += REPEAT_WEIGHT;
    }
    if (isConsecutiveRepeat) {
      cost += CONSECUTIVE_REPEAT_WEIGHT;
    }

    return cost;
  }

  static wouldCreateThreeSame(player, assignedColor) {
    const history = this.getLastColors(player, 2);
    if (history.length < 2) {
      return false;
    }
    return history[0] === history[1] && history[1] === assignedColor;
  }

  /**
   * Group players by score
   */
  static groupByScore(players) {
    const groups = [];
    const scoreMap = new Map();

    for (const player of players) {
      if (!scoreMap.has(player.score)) {
        scoreMap.set(player.score, []);
      }
      scoreMap.get(player.score).push(player);
    }

    // Sort by score descending
    const sortedScores = Array.from(scoreMap.keys()).sort((a, b) => b - a);
    
    for (const score of sortedScores) {
      groups.push(scoreMap.get(score));
    }

    return groups;
  }

  /**
   * Calculate pairing score (higher is better)
   * Considers color balance and color history
   */
  static calculatePairingScore(player1, player2, roundNumber) {
    let score = 0;

    // Prefer pairing players with opposite color balance (27A4)
    const colorDiff = Math.abs(player1.colorBalance - player2.colorBalance);
    score += colorDiff * 100;

    // Prefer pairing players with similar scores (already grouped, but fine-tune)
    const scoreDiff = Math.abs(player1.score - player2.score);
    score -= scoreDiff * 10;

    // Check color history to avoid 3+ of same color in a row (27A4)
    const player1LastColors = this.getLastColors(player1, 2);
    const player2LastColors = this.getLastColors(player2, 2);
    
    // Prefer if this pairing would give alternating colors
    if (player1LastColors.length > 0 && player2LastColors.length > 0) {
      const player1LastColor = player1LastColors[player1LastColors.length - 1];
      const player2LastColor = player2LastColors[player2LastColors.length - 1];
      
      // If both had same color last time, prefer opposite assignments
      if (player1LastColor === player2LastColor) {
        score += 50;
      }
    }

    return score;
  }

  /**
   * Get last N colors from color history
   */
  static getLastColors(player, n) {
    if (!player.colorHistory || !Array.isArray(player.colorHistory)) {
      return [];
    }
    return player.colorHistory.slice(-n);
  }

  /**
   * Assign colors to players (27A4, 27A5)
   * 27A4: Equalize colors, not more than 2 of same color in a row
   * 27A5: Alternate colors when possible
   */
  static assignColors(player1, player2, roundNumber) {
    const player1LastColors = this.getLastColors(player1, 2);
    const player2LastColors = this.getLastColors(player2, 2);

    // Check if either player has 2 of same color in a row (27A4)
    const player1NeedsOpposite = player1LastColors.length === 2 && 
                                 player1LastColors[0] === player1LastColors[1];
    const player2NeedsOpposite = player2LastColors.length === 2 && 
                                 player2LastColors[0] === player2LastColors[1];

    // If one needs opposite color, assign accordingly
    if (player1NeedsOpposite && !player2NeedsOpposite) {
      const neededColor = player1LastColors[0] === 'white' ? 'black' : 'white';
      if (neededColor === 'white') {
        return { white: player1, black: player2 };
      } else {
        return { white: player2, black: player1 };
      }
    }
    if (player2NeedsOpposite && !player1NeedsOpposite) {
      const neededColor = player2LastColors[0] === 'white' ? 'black' : 'white';
      if (neededColor === 'white') {
        return { white: player2, black: player1 };
      } else {
        return { white: player1, black: player2 };
      }
    }

    // Both need opposite or neither needs opposite - use color balance (27A4)
    if (player1.colorBalance < player2.colorBalance) {
      return { white: player1, black: player2 };
    } else if (player2.colorBalance < player1.colorBalance) {
      return { white: player2, black: player1 };
    } else {
      // Equal color balance - alternate based on round (27A5)
      // In odd rounds, prefer alternating; in even rounds, try to equalize
      if (roundNumber % 2 === 1) {
        // Odd round: alternate from previous round
        const player1Last = player1LastColors.length > 0 ? player1LastColors[player1LastColors.length - 1] : null;
        if (player1Last === 'black') {
          return { white: player1, black: player2 };
        } else if (player1Last === 'white') {
          return { white: player2, black: player1 };
        }
      }
      // Default: use player ID to break tie
      return player1.id < player2.id 
        ? { white: player1, black: player2 }
        : { white: player2, black: player1 };
    }
  }

  /**
   * Calculate standings from tournament data
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

        // Record opponents (27A1)
        player1.previousOpponents.push(player2.id);
        player2.previousOpponents.push(player1.id);

        // Update color balance and history (27A4, 27A5)
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
      // Within same score, rank by rating
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      // Then by color balance
      return b.colorBalance - a.colorBalance;
    });

    return players.map((p, index) => ({
      rank: index + 1,
      id: p.id,
      name: p.name,
      rating: p.rating || null,
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

module.exports = SwissPairing;
