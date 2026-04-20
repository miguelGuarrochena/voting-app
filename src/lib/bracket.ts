import { VersusOption, Duel, Round, Bracket } from '@/types/versus';

/**
 * Shuffles array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates a tournament bracket with random seeding
 */
export function generateBracket(options: VersusOption[], votesToWin: number): Bracket {
  const shuffledOptions = shuffleArray(options);
  const rounds: Round[] = [];
  
  // Determine number of rounds based on option count
  const totalOptions = options.length;
  const totalRounds = totalOptions === 4 ? 2 : totalOptions === 8 ? 3 : totalOptions === 16 ? 4 : 0;

  if (totalRounds === 0) {
    throw new Error('Invalid number of options. Must be 4, 8, or 16.');
  }
  
  // Generate first round (quarterfinals for 8 options, semifinals for 4)
  let currentOptions = [...shuffledOptions];
  
  for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
    const duels: Duel[] = [];
    const duelsInThisRound = currentOptions.length / 2;
    
    for (let i = 0; i < duelsInThisRound; i++) {
      const optionA = currentOptions[i * 2];
      const optionB = currentOptions[i * 2 + 1];
      
      const duel: Duel = {
        id: `round-${roundNumber}-duel-${i}`,
        optionA,
        optionB,
        votesA: 0,
        votesB: 0,
        winner: null,
        isRandomWinner: false,
        round: roundNumber,
        voters: {},
      };
      
      duels.push(duel);
    }
    
    rounds.push({
      roundNumber,
      duels,
    });
    
    // Prepare options for next round (placeholders)
    // Each duel produces 1 winner, so we need duels.length winners for next round
    const nextRoundOptionsCount = duels.length;
    currentOptions = Array(nextRoundOptionsCount).fill(null).map(() => ({
      id: '',
      title: '???',
    }));
  }
  
  return {
    rounds,
    currentRound: 0,
    status: 'active',
    champion: null,
  };
}

/**
 * Records a vote for a duel
 */
export function voteInDuel(
  bracket: Bracket,
  duelId: string,
  username: string,
  optionId: string
): Bracket {
  const newBracket = JSON.parse(JSON.stringify(bracket)) as Bracket;
  
  for (const round of newBracket.rounds) {
    for (const duel of round.duels) {
      if (duel.id === duelId) {
        // Check if user already voted in this duel
        if (duel.voters[username]) {
          // Remove previous vote
          const previousVote = duel.voters[username];
          if (previousVote === duel.optionA.id) {
            duel.votesA = Math.max(0, duel.votesA - 1);
          } else if (previousVote === duel.optionB.id) {
            duel.votesB = Math.max(0, duel.votesB - 1);
          }
        }
        
        // Add new vote
        duel.voters[username] = optionId;
        if (optionId === duel.optionA.id) {
          duel.votesA++;
        } else if (optionId === duel.optionB.id) {
          duel.votesB++;
        }
        
        return newBracket;
      }
    }
  }
  
  return newBracket;
}

/**
 * Checks if a duel is won
 */
export function isDuelWon(duel: Duel, votesToWin: number): boolean {
  return duel.votesA >= votesToWin || duel.votesB >= votesToWin;
}

/**
 * Gets the winner of a duel
 */
export function getDuelWinner(duel: Duel): VersusOption | null {
  if (duel.votesA > duel.votesB) {
    return duel.optionA;
  } else if (duel.votesB > duel.votesA) {
    return duel.optionB;
  }
  return null;
}

/**
 * Checks if all duels in current round are resolved
 */
export function isRoundComplete(bracket: Bracket, votesToWin: number): boolean {
  const currentRound = bracket.rounds[bracket.currentRound];
  if (!currentRound) return false;
  
  return currentRound.duels.every(duel => isDuelWon(duel, votesToWin));
}

/**
 * Advances to the next round with winners from current round
 */
export function advanceToNextRound(bracket: Bracket, votesToWin: number): Bracket {
  const newBracket = JSON.parse(JSON.stringify(bracket)) as Bracket;
  
  if (newBracket.currentRound >= newBracket.rounds.length - 1) {
    // Tournament is complete, determine champion
    const finalRound = newBracket.rounds[newBracket.currentRound];
    const finalDuel = finalRound.duels[0];
    const winner = getDuelWinner(finalDuel);
    
    newBracket.status = 'finished';
    newBracket.champion = winner || (finalDuel.votesA >= finalDuel.votesB ? finalDuel.optionA : finalDuel.optionB);
    return newBracket;
  }
  
  // Get winners from current round
  const currentRound = newBracket.rounds[newBracket.currentRound];
  const winners: VersusOption[] = [];
  
  for (const duel of currentRound.duels) {
    const winner = getDuelWinner(duel);
    if (winner) {
      winners.push(winner);
      duel.winner = winner;
    } else {
      // Should not happen if round is complete
      const fallbackWinner = duel.votesA >= duel.votesB ? duel.optionA : duel.optionB;
      winners.push(fallbackWinner);
      duel.winner = fallbackWinner;
    }
  }
  
  // Set up next round with winners
  const nextRoundIndex = newBracket.currentRound + 1;
  const nextRound = newBracket.rounds[nextRoundIndex];
  
  // Each duel in next round needs 2 winners (optionA and optionB)
  for (let i = 0; i < nextRound.duels.length; i++) {
    const duel = nextRound.duels[i];
    duel.optionA = winners[i * 2];
    duel.optionB = winners[i * 2 + 1];
  }
  
  newBracket.currentRound = nextRoundIndex;
  
  return newBracket;
}

/**
 * Handles expiration - resolves all remaining duels with random winners if tied
 */
export function handleExpiration(bracket: Bracket, votesToWin: number): Bracket {
  const newBracket = JSON.parse(JSON.stringify(bracket)) as Bracket;
  newBracket.status = 'expired';
  
  // Resolve all incomplete duels
  for (const round of newBracket.rounds) {
    for (const duel of round.duels) {
      if (!duel.winner) {
        if (duel.votesA === duel.votesB || duel.votesA === 0 && duel.votesB === 0) {
          // Random winner
          duel.isRandomWinner = true;
          duel.winner = Math.random() < 0.5 ? duel.optionA : duel.optionB;
        } else {
          // Winner with more votes
          duel.winner = getDuelWinner(duel) || (duel.votesA >= duel.votesB ? duel.optionA : duel.optionB);
        }
      }
    }
  }
  
  // Determine champion from final round
  const finalRound = newBracket.rounds[newBracket.rounds.length - 1];
  const finalDuel = finalRound.duels[0];
  newBracket.champion = finalDuel.winner;
  
  return newBracket;
}

/**
 * Gets suggested votes to win based on group size
 */
export function getVoteSuggestion(groupSize: number): number {
  if (groupSize <= 2) return 2;
  if (groupSize <= 4) return 3;
  if (groupSize <= 6) return 4;
  if (groupSize <= 10) return 5;
  return 6;
}

/**
 * Gets all active duels in current round
 */
export function getActiveDuels(bracket: Bracket): Duel[] {
  if (bracket.status !== 'active') return [];
  const currentRound = bracket.rounds[bracket.currentRound];
  return currentRound?.duels || [];
}
