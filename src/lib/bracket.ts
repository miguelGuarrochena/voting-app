import { VersusOption, Duel, Round, Bracket, UserBracket } from '@/types/versus';

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
 * Generates a tournament bracket template with random seeding
 */
export function generateBracket(options: VersusOption[]): Bracket {
  const shuffledOptions = shuffleArray(options);
  const rounds: Round[] = [];
  
  // Determine number of rounds based on option count
  const totalOptions = options.length;
  const totalRounds = totalOptions === 4 ? 2 : totalOptions === 8 ? 3 : totalOptions === 16 ? 4 : 0;

  if (totalRounds === 0) {
    throw new Error('Invalid number of options. Must be 4, 8, or 16.');
  }
  
  // Generate first round
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
        selectedWinner: null,
        round: roundNumber,
      };
      
      duels.push(duel);
    }
    
    rounds.push({
      roundNumber,
      duels,
    });
    
    // Prepare options for next round (placeholders)
    const nextRoundOptionsCount = duels.length;
    currentOptions = Array(nextRoundOptionsCount).fill(null).map(() => ({
      id: '',
      title: '???',
    }));
  }
  
  return {
    rounds,
    champion: null,
  };
}

/**
 * Updates a user's selection for a duel
 */
export function selectWinner(
  bracket: Bracket,
  duelId: string,
  winner: VersusOption
): Bracket {
  const newBracket = JSON.parse(JSON.stringify(bracket)) as Bracket;
  
  for (const round of newBracket.rounds) {
    for (const duel of round.duels) {
      if (duel.id === duelId) {
        duel.selectedWinner = winner;
        return newBracket;
      }
    }
  }
  
  return newBracket;
}

/**
 * Calculates the completed bracket based on user selections
 * Advances winners to next rounds automatically
 */
export function calculateCompletedBracket(bracket: Bracket): Bracket {
  const newBracket = JSON.parse(JSON.stringify(bracket)) as Bracket;
  
  // Process each round from first to last
  for (let roundIndex = 0; roundIndex < newBracket.rounds.length - 1; roundIndex++) {
    const currentRound = newBracket.rounds[roundIndex];
    const nextRound = newBracket.rounds[roundIndex + 1];
    const winners: VersusOption[] = [];
    
    // Get winners from current round
    for (const duel of currentRound.duels) {
      if (duel.selectedWinner) {
        winners.push(duel.selectedWinner);
      } else {
        // If no selection, use placeholder
        winners.push({ id: '', title: '???' });
      }
    }
    
    // Update next round with winners
    for (let i = 0; i < nextRound.duels.length; i++) {
      const duel = nextRound.duels[i];
      if (winners[i * 2]) duel.optionA = winners[i * 2];
      if (winners[i * 2 + 1]) duel.optionB = winners[i * 2 + 1];
    }
  }
  
  // Determine champion from final round
  const finalRound = newBracket.rounds[newBracket.rounds.length - 1];
  if (finalRound.duels[0]?.selectedWinner) {
    newBracket.champion = finalRound.duels[0].selectedWinner;
  }
  
  return newBracket;
}

/**
 * Checks if all duels in the bracket have selections
 */
export function isBracketComplete(bracket: Bracket): boolean {
  for (const round of bracket.rounds) {
    for (const duel of round.duels) {
      if (!duel.selectedWinner) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Gets the completion percentage of a bracket
 */
export function getBracketProgress(bracket: Bracket): number {
  let totalDuels = 0;
  let completedDuels = 0;
  
  for (const round of bracket.rounds) {
    for (const duel of round.duels) {
      totalDuels++;
      if (duel.selectedWinner) {
        completedDuels++;
      }
    }
  }
  
  return totalDuels > 0 ? Math.round((completedDuels / totalDuels) * 100) : 0;
}

/**
 * Creates a user bracket from selections
 */
export function createUserBracket(
  username: string,
  bracket: Bracket
): UserBracket {
  const completedBracket = calculateCompletedBracket(bracket);
  
  return {
    username,
    bracket: completedBracket,
    champion: completedBracket.champion,
    completedAt: new Date().toISOString(),
  };
}
