const compareIds = (a, b) => {
  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }
  return String(a).localeCompare(String(b));
};

const pairKey = (a, b) => (compareIds(a, b) <= 0 ? `${a}|${b}` : `${b}|${a}`);

const normalizeColor = (color) => {
  if (!color) return null;
  if (color === 'W') return 'white';
  if (color === 'B') return 'black';
  return color;
};

const getLastColors = (player, n) => {
  if (!player.colorHistory || !Array.isArray(player.colorHistory)) {
    return [];
  }
  return player.colorHistory.slice(-n).map(normalizeColor);
};

const wouldCreateThreeSame = (player, assignedColor) => {
  const history = getLastColors(player, 2);
  if (history.length < 2) {
    return false;
  }
  return history[0] === history[1] && history[1] === assignedColor;
};

const assignColors = (player1, player2, roundNumber) => {
  const player1LastColors = getLastColors(player1, 2);
  const player2LastColors = getLastColors(player2, 2);

  const player1NeedsOpposite =
    player1LastColors.length === 2 && player1LastColors[0] === player1LastColors[1];
  const player2NeedsOpposite =
    player2LastColors.length === 2 && player2LastColors[0] === player2LastColors[1];

  if (player1NeedsOpposite && !player2NeedsOpposite) {
    const neededColor = player1LastColors[0] === 'white' ? 'black' : 'white';
    return neededColor === 'white'
      ? { white: player1, black: player2 }
      : { white: player2, black: player1 };
  }
  if (player2NeedsOpposite && !player1NeedsOpposite) {
    const neededColor = player2LastColors[0] === 'white' ? 'black' : 'white';
    return neededColor === 'white'
      ? { white: player2, black: player1 }
      : { white: player1, black: player2 };
  }

  if (player1.colorBalance < player2.colorBalance) {
    return { white: player1, black: player2 };
  }
  if (player2.colorBalance < player1.colorBalance) {
    return { white: player2, black: player1 };
  }

  if (roundNumber % 2 === 1) {
    const player1Last = player1LastColors.length
      ? player1LastColors[player1LastColors.length - 1]
      : null;
    if (player1Last === 'black') {
      return { white: player1, black: player2 };
    }
    if (player1Last === 'white') {
      return { white: player2, black: player1 };
    }
  }

  return compareIds(player1.id, player2.id) <= 0
    ? { white: player1, black: player2 }
    : { white: player2, black: player1 };
};

const buildHistory = (rounds) => {
  const playedPairs = new Set();
  const opponentsMap = new Map();
  const byeCounts = new Map();
  const lastRoundPairs = new Set();

  if (!rounds || rounds.length === 0) {
    return { playedPairs, opponentsMap, byeCounts, lastRoundPairs };
  }

  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const lastRound = sortedRounds[sortedRounds.length - 1];

  for (const round of sortedRounds) {
    for (const pairing of round.pairings || []) {
      if (pairing.isBye && pairing.player1) {
        const count = byeCounts.get(pairing.player1.id) || 0;
        byeCounts.set(pairing.player1.id, count + 1);
        continue;
      }
      if (!pairing.player1 || !pairing.player2) {
        continue;
      }
      const key = pairKey(pairing.player1.id, pairing.player2.id);
      playedPairs.add(key);

      if (!opponentsMap.has(pairing.player1.id)) {
        opponentsMap.set(pairing.player1.id, new Set());
      }
      if (!opponentsMap.has(pairing.player2.id)) {
        opponentsMap.set(pairing.player2.id, new Set());
      }
      opponentsMap.get(pairing.player1.id).add(pairing.player2.id);
      opponentsMap.get(pairing.player2.id).add(pairing.player1.id);

      if (round === lastRound) {
        lastRoundPairs.add(key);
      }
    }
  }

  return { playedPairs, opponentsMap, byeCounts, lastRoundPairs };
};

const chooseBye = (players, history) => {
  if (players.length % 2 === 0) {
    return null;
  }
  const { byeCounts } = history;
  const sorted = [...players].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingA !== ratingB) return ratingA - ratingB;
    return compareIds(a.id, b.id);
  });

  const noByeCandidate = sorted.find((player) => (byeCounts.get(player.id) || 0) === 0);
  return noByeCandidate || sorted[0];
};

const buildOrderMap = (players) => {
  const orderMap = new Map();
  players.forEach((player, index) => orderMap.set(player.id, index));
  return orderMap;
};

const calculatePairCost = (player1, player2, context) => {
  const SCORE_GAP_WEIGHT = 1000;
  const COLOR_BALANCE_WEIGHT = 10;
  const STREAK_WEIGHT = 500;
  const REPEAT_WEIGHT = 1000000;
  const CONSECUTIVE_REPEAT_WEIGHT = 10000000;

  const {
    roundNumber,
    scoreGap,
    isRepeat,
    isConsecutiveRepeat,
    topBottomPenalty,
  } = context;

  let cost = 0;
  cost += scoreGap * SCORE_GAP_WEIGHT;

  const colorBalanceGap = Math.abs(player1.colorBalance + player2.colorBalance);
  cost += colorBalanceGap * COLOR_BALANCE_WEIGHT;

  const { white, black } = assignColors(player1, player2, roundNumber);
  if (wouldCreateThreeSame(white, 'white')) cost += STREAK_WEIGHT;
  if (wouldCreateThreeSame(black, 'black')) cost += STREAK_WEIGHT;

  if (isRepeat) cost += REPEAT_WEIGHT;
  if (isConsecutiveRepeat) cost += CONSECUTIVE_REPEAT_WEIGHT;

  if (topBottomPenalty) {
    cost += topBottomPenalty;
  }

  return cost;
};

const solveGroupPairings = (players, context) => {
  if (players.length === 0) {
    return { pairs: [], cost: 0, repeatCount: 0 };
  }

  const {
    roundNumber,
    playedPairs,
    opponentsMap,
    lastRoundPairs,
    allowRepeats,
    orderMap,
    halfSize,
    topBottomWeight,
  } = context;

  let best = null;

  const availableOpponents = (player, candidates) => {
    if (allowRepeats) return candidates;
    const opps = opponentsMap.get(player.id) || new Set();
    return candidates.filter((candidate) => !opps.has(candidate.id));
  };

  const backtrack = (remaining, currentPairs, cost, repeatCount) => {
    if (remaining.length === 0) {
      if (!best) {
        best = { pairs: currentPairs, cost, repeatCount };
        return;
      }
      if (allowRepeats) {
        if (
          repeatCount < best.repeatCount ||
          (repeatCount === best.repeatCount && cost < best.cost)
        ) {
          best = { pairs: currentPairs, cost, repeatCount };
        }
      } else if (cost < best.cost) {
        best = { pairs: currentPairs, cost, repeatCount };
      }
      return;
    }

    let bestIndex = 0;
    let bestOpponentCount = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidatePool = remaining.filter((_, idx) => idx !== i);
      const available = availableOpponents(remaining[i], candidatePool);
      if (available.length < bestOpponentCount) {
        bestOpponentCount = available.length;
        bestIndex = i;
      }
    }

    const player = remaining[bestIndex];
    const rest = remaining.filter((_, idx) => idx !== bestIndex);
    const available = availableOpponents(player, rest);

    if (available.length === 0) {
      return;
    }

    const candidatePairs = available.map((opponent) => {
      const isRepeat = playedPairs.has(pairKey(player.id, opponent.id));
      const isConsecutiveRepeat = lastRoundPairs.has(pairKey(player.id, opponent.id));
      const { white, black } = assignColors(player, opponent, roundNumber);

      let topBottomPenalty = 0;
      if (orderMap && halfSize && topBottomWeight) {
        const playerIndex = orderMap.get(player.id);
        const opponentIndex = orderMap.get(opponent.id);
        if (playerIndex !== undefined && opponentIndex !== undefined) {
          const preferred =
            playerIndex < halfSize ? playerIndex + halfSize : playerIndex - halfSize;
          topBottomPenalty =
            Math.abs(opponentIndex - preferred) * topBottomWeight;
        }
      }

      const scoreGap = Math.abs(player.score - opponent.score);
      const pairCost = calculatePairCost(player, opponent, {
        roundNumber,
        scoreGap,
        isRepeat,
        isConsecutiveRepeat,
        topBottomPenalty,
      });

      return { opponent, white, black, isRepeat, pairCost };
    });

    candidatePairs.sort((a, b) => {
      if (a.pairCost !== b.pairCost) return a.pairCost - b.pairCost;
      return compareIds(a.opponent.id, b.opponent.id);
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

      const nextRemaining = rest.filter((p) => p.id !== candidate.opponent.id);
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
};

const groupPlayersByScore = (players, getScore) => {
  const groups = new Map();
  for (const player of players) {
    const score = getScore(player);
    if (!groups.has(score)) {
      groups.set(score, []);
    }
    groups.get(score).push(player);
  }

  const sortedScores = Array.from(groups.keys()).sort((a, b) => b - a);
  return sortedScores.map((score) => ({
    score,
    players: groups.get(score),
  }));
};

const solveScoreGroups = (groups, context) => {
  let best = null;

  const solveGroupIndex = (index, carryOver, pairs, cost, repeatCount) => {
    if (index >= groups.length) {
      if (carryOver.length > 0) {
        return;
      }
      const result = { pairs, cost, repeatCount };
      if (!best) {
        best = result;
        return;
      }
      if (context.allowRepeats) {
        if (
          repeatCount < best.repeatCount ||
          (repeatCount === best.repeatCount && cost < best.cost)
        ) {
          best = result;
        }
      } else if (cost < best.cost) {
        best = result;
      }
      return;
    }

    const group = groups[index];
    const groupOrdered = [...group.players].sort((a, b) => {
      if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
      return compareIds(a.id, b.id);
    });
    const groupPlayers = [...carryOver, ...groupOrdered];

    if (groupPlayers.length === 0) {
      solveGroupIndex(index + 1, [], pairs, cost, repeatCount);
      return;
    }

    const orderMap = buildOrderMap(groupPlayers);
    const halfSize = Math.floor(groupPlayers.length / 2);
    const baseContext = {
      ...context,
      orderMap,
      halfSize,
    };

    const trySolve = (remainingPlayers, nextCarry) => {
      if (remainingPlayers.length % 2 !== 0) {
        return;
      }
      const orderForRemaining = buildOrderMap(remainingPlayers);
      const contextForGroup = {
        ...baseContext,
        orderMap: orderForRemaining,
        halfSize: Math.floor(remainingPlayers.length / 2),
      };
      const groupResult = solveGroupPairings(remainingPlayers, contextForGroup);
      if (!groupResult) {
        return;
      }
      solveGroupIndex(
        index + 1,
        nextCarry,
        [...pairs, ...groupResult.pairs],
        cost + groupResult.cost,
        repeatCount + groupResult.repeatCount
      );
    };

    if (groupPlayers.length % 2 === 0) {
      trySolve(groupPlayers, []);
    }

    const floaterCandidates = [...groupOrdered].sort((a, b) => {
      if (a.rating !== b.rating) return (a.rating || 0) - (b.rating || 0);
      return compareIds(a.id, b.id);
    });

    for (const floater of floaterCandidates) {
      const remaining = groupPlayers.filter((p) => p.id !== floater.id);
      trySolve(remaining, [floater]);
    }
  };

  solveGroupIndex(0, [], [], 0, 0);
  return best;
};

const generateSwissPairings = (players, roundNumber, rounds, options) => {
  const {
    getScore,
    allowRepeats,
    playedPairs,
    opponentsMap,
    lastRoundPairs,
    topBottomWeight,
  } = options;

  const groups = groupPlayersByScore(players, getScore);
  const result = solveScoreGroups(groups, {
    roundNumber,
    allowRepeats,
    playedPairs,
    opponentsMap,
    lastRoundPairs,
    topBottomWeight,
  });

  return result;
};

const buildPairingResult = (pairingResult, byePlayer, forcedRepeat, forcedReason) => {
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

  if (byePlayer) {
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
    notes: forcedRepeat
      ? { forcedRepeatReason: forcedReason || 'no-repeat unsatisfiable' }
      : {},
  };
};

const generateSwissRound = (players, roundNumber, rounds, config) => {
  const shouldWarn = () =>
    process.env.SWISS_PAIRING_WARN === '1' || process.env.NODE_ENV !== 'test';

  const history = buildHistory(rounds);
  const byePlayer = chooseBye(players, history);
  const pairingPool = byePlayer
    ? players.filter((p) => p.id !== byePlayer.id)
    : [...players];

  const getScore = config.getScore || ((player) => player.score);

  const noRepeatResult = generateSwissPairings(pairingPool, roundNumber, rounds, {
    getScore,
    allowRepeats: false,
    playedPairs: history.playedPairs,
    opponentsMap: history.opponentsMap,
    lastRoundPairs: history.lastRoundPairs,
    topBottomWeight: config.topBottomWeight || 0,
  });

  if (noRepeatResult) {
    return buildPairingResult(noRepeatResult, byePlayer, false, null);
  }

  const repeatResult = generateSwissPairings(pairingPool, roundNumber, rounds, {
    getScore,
    allowRepeats: true,
    playedPairs: history.playedPairs,
    opponentsMap: history.opponentsMap,
    lastRoundPairs: history.lastRoundPairs,
    topBottomWeight: config.topBottomWeight || 0,
  });

  if (repeatResult && repeatResult.repeatCount > 0 && shouldWarn()) {
    console.warn(
      `[SwissPairing] Round ${roundNumber}: no-repeat unsatisfiable, forced repeats=${repeatResult.repeatCount}`
    );
  }

  return buildPairingResult(
    repeatResult,
    byePlayer,
    true,
    'no-repeat unsatisfiable'
  );
};

module.exports = {
  compareIds,
  pairKey,
  buildHistory,
  generateSwissRound,
};
