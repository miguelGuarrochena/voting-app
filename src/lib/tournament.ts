import { Tournament, TournamentMode, Player, Match, BracketMatch, LeagueMatch, LeagueStanding, MatchResult, ScoreResult, WinLossResult, getScoreWinner } from '@/types/versus';

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
 * Generates bracket matches for elimination tournament
 * Only accepts 2, 4, 8, or 16 players.
 *
 * Special case: playerCount === 2 with homeAndAway === true generates 2
 * matches in round 1 (home and away). The champion is decided by aggregate
 * (see getBracketChampion).
 */
export function generateBracketMatches(
  players: Player[],
  randomize: boolean = false,
  homeAndAway: boolean = false
): BracketMatch[] {
  const playerCount = players.length;

  // Validate player count
  if (![2, 4, 8, 16].includes(playerCount)) {
    throw new Error('Invalid number of players. Bracket mode requires 2, 4, 8, or 16 players.');
  }

  // Shuffle if requested
  const shuffledPlayers = randomize ? shuffleArray(players) : [...players];

  // Special case: 2 players, home and away
  // Round 1 has 2 matches:
  //   match 0: A (home) vs B (away)
  //   match 1: B (home) vs A (away)
  // No round 2 — the champion is calculated by aggregate.
  if (playerCount === 2 && homeAndAway) {
    const [pA, pB] = shuffledPlayers;
    return [
      {
        id: 'match-0',
        playerA: pA,
        playerB: pB,
        result: null,
        round: 1,
        status: 'pending',
        position: 0,
        nextMatchId: null,
        nextMatchPosition: null,
      },
      {
        id: 'match-1',
        playerA: pB,
        playerB: pA,
        result: null,
        round: 1,
        status: 'pending',
        position: 1,
        nextMatchId: null,
        nextMatchPosition: null,
      },
    ];
  }

  // Calculate number of rounds
  const totalRounds = playerCount === 2 ? 1 : Math.log2(playerCount);

  const matches: BracketMatch[] = [];
  let matchIdCounter = 0;

  // Generate matches for each round
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = playerCount / Math.pow(2, round);

    for (let i = 0; i < matchesInRound; i++) {
      const matchId = `match-${matchIdCounter++}`;

      // For first round, use actual players
      // For subsequent rounds, use placeholders (will be filled when advancing)
      let playerA: Player;
      let playerB: Player;

      if (round === 1) {
        playerA = shuffledPlayers[i * 2];
        playerB = shuffledPlayers[i * 2 + 1];
      } else {
        // Placeholder players - will be replaced with winners from previous round
        playerA = { id: '', name: 'TBD' };
        playerB = { id: '', name: 'TBD' };
      }

      const match: BracketMatch = {
        id: matchId,
        playerA,
        playerB,
        result: null,
        round,
        status: 'pending',
        position: i,
        nextMatchId: null, // Will be set after all matches are generated
        nextMatchPosition: null,
      };

      matches.push(match);
    }
  }

  // Set nextMatchId and nextMatchPosition for each match
  // This links each match to the match its winner advances to
  for (let round = 1; round < totalRounds; round++) {
    const currentRoundMatches = matches.filter(m => m.round === round);
    const nextRoundMatches = matches.filter(m => m.round === round + 1);

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const currentMatch = currentRoundMatches[i];
      const nextMatchIndex = Math.floor(i / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];

      if (nextMatch) {
        currentMatch.nextMatchId = nextMatch.id;
        currentMatch.nextMatchPosition = i % 2 === 0 ? 'A' : 'B';
      }
    }
  }

  return matches;
}

/**
 * Detects if a bracket is a 2-player home-and-away setup:
 * exactly 2 matches, both round 1, same two players in both.
 */
export function isHomeAndAwayBracket(matches: BracketMatch[]): boolean {
  if (matches.length !== 2) return false;
  if (matches.some(m => m.round !== 1)) return false;
  const [m1, m2] = matches;
  const ids1 = new Set([m1.playerA.id, m1.playerB.id]);
  const ids2 = new Set([m2.playerA.id, m2.playerB.id]);
  if (ids1.size !== 2 || ids2.size !== 2) return false;
  const ids1Arr = Array.from(ids1);
  for (const id of ids1Arr) if (!ids2.has(id)) return false;
  return true;
}

/**
 * Generates league matches (round robin - everyone plays everyone once)
 * Works with any number of players.
 *
 * - If randomize === true, pairings are arranged in a random sequence
 *   (doesn't affect the matchups themselves, just the display order).
 * - If randomize === false, the order of the players list is respected:
 *   first all matches for player 0, then player 1, etc.
 *   This is what the "I set up the matches" mode uses.
 */
export function generateLeagueMatches(
  players: Player[],
  randomize: boolean = false
): LeagueMatch[] {
  const matches: LeagueMatch[] = [];
  let matchIdCounter = 0;

  // Generate all unique pairings respecting the order of `players`
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const match: LeagueMatch = {
        id: `match-${matchIdCounter++}`,
        playerA: players[i],
        playerB: players[j],
        result: null,
        round: 1, // League has single round
        status: 'pending',
      };
      matches.push(match);
    }
  }

  // If randomize, shuffle the order of matches (still same pairings, different sequence).
  // Reassign ids in order so they match the visual order.
  if (randomize) {
    const shuffled = shuffleArray(matches);
    return shuffled.map((m, idx) => ({ ...m, id: `match-${idx}` }));
  }

  return matches;
}

/**
 * Calculates league standings from completed matches
 * Scoring: 3pts win, 1pt draw, 0pts loss
 */
export function calculateLeagueStandings(
  players: Player[],
  matches: LeagueMatch[]
): LeagueStanding[] {
  const standings: Map<string, LeagueStanding> = new Map();

  // Initialize standings for all players
  for (const player of players) {
    standings.set(player.id, {
      player,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
    });
  }

  // Process completed matches
  for (const match of matches) {
    if (match.status !== 'completed' || !match.result) continue;

    const standingA = standings.get(match.playerA.id);
    const standingB = standings.get(match.playerB.id);

    if (!standingA || !standingB) continue;

    if (match.result.type === 'score') {
      const winner = getScoreWinner(match.result);
      if (winner === 'A') {
        standingA.wins++;
        standingA.points += 3;
        standingB.losses++;
      } else if (winner === 'B') {
        standingB.wins++;
        standingB.points += 3;
        standingA.losses++;
      } else {
        // Draw
        standingA.draws++;
        standingA.points += 1;
        standingB.draws++;
        standingB.points += 1;
      }
    } else if (match.result.type === 'winloss') {
      if (match.result.winner === 'A') {
        standingA.wins++;
        standingA.points += 3;
        standingB.losses++;
      } else if (match.result.winner === 'B') {
        standingB.wins++;
        standingB.points += 3;
        standingA.losses++;
      } else {
        // Draw
        standingA.draws++;
        standingA.points += 1;
        standingB.draws++;
        standingB.points += 1;
      }
    }
  }

  // Convert to array and sort by points (descending), then wins, then draws
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.draws - a.draws;
  });
}

/**
 * Gets the champion of a bracket tournament.
 *
 * Special case home-and-away (2 matches in round 1, same 2 players):
 *   - hasScore: champion = player with the highest goal total. If there's
 *     a tie on aggregate, we return null (no champion until manually broken
 *     — future improvement: extra time / penalties).
 *   - winloss: champion = the one who won more matches (1-0 or 2-0). If 1-1
 *     in wins, also null.
 */
export function getBracketChampion(matches: BracketMatch[]): Player | null {
  if (matches.length === 0) return null;

  // Home-and-away: aggregate of the 2 round 1 matches
  if (isHomeAndAwayBracket(matches)) {
    if (!matches.every(m => m.status === 'completed' && m.result)) return null;

    const [m1, m2] = matches;
    // Need to identify each player by id stably
    const idA = m1.playerA.id;

    if (m1.result?.type === 'score' && m2.result?.type === 'score') {
      // Add up goals for each player (note: in m2 the slots are reversed)
      const goalsA = m1.result.scoreA + (m2.playerA.id === idA ? m2.result.scoreA : m2.result.scoreB);
      const goalsB = m1.result.scoreB + (m2.playerA.id === idA ? m2.result.scoreB : m2.result.scoreA);
      if (goalsA > goalsB) return m1.playerA;
      if (goalsB > goalsA) return m1.playerB;
      return null;
    }

    if (m1.result?.type === 'winloss' && m2.result?.type === 'winloss') {
      const wonByIdA = (m: BracketMatch) => {
        if (m.result?.type !== 'winloss') return false;
        const winnerSlot = m.result.winner; // 'A' | 'B' | 'draw'
        if (winnerSlot === 'draw') return false;
        const winnerPlayer = winnerSlot === 'A' ? m.playerA : m.playerB;
        return winnerPlayer.id === idA;
      };
      const winsA = (wonByIdA(m1) ? 1 : 0) + (wonByIdA(m2) ? 1 : 0);
      const draws =
        (m1.result.winner === 'draw' ? 1 : 0) +
        (m2.result.winner === 'draw' ? 1 : 0);
      const winsB = 2 - winsA - draws;
      if (winsA > winsB) return m1.playerA;
      if (winsB > winsA) return m1.playerB;
      return null;
    }

    return null;
  }

  // Normal bracket: the match from the highest round
  const maxRound = Math.max(...matches.map(m => m.round));
  const finalMatches = matches.filter(m => m.round === maxRound);

  if (finalMatches.length === 0) return null;

  const finalMatch = finalMatches[0];
  if (finalMatch.status !== 'completed' || !finalMatch.result) return null;

  // Determine winner
  if (finalMatch.result.type === 'score') {
    const winner = getScoreWinner(finalMatch.result);
    return winner === 'A' ? finalMatch.playerA : finalMatch.playerB;
  } else if (finalMatch.result.type === 'winloss') {
    return finalMatch.result.winner === 'A' ? finalMatch.playerA : finalMatch.playerB;
  }

  return null;
}

/**
 * Gets the champion of a league tournament
 * Only returns a champion if ALL matches are completed
 */
export function getLeagueChampion(standings: LeagueStanding[], matches: LeagueMatch[]): Player | null {
  if (standings.length === 0) return null;

  // Only declare a champion if ALL matches are completed
  const allMatchesCompleted = matches.every(m => m.status === 'completed');
  if (!allMatchesCompleted) return null;

  // First in standings is the champion
  return standings[0].player;
}

/**
 * Checks if a round is complete (all matches in that round are completed)
 */
export function isRoundComplete(matches: Match[], roundNumber: number): boolean {
  const roundMatches = matches.filter(m => m.round === roundNumber);
  if (roundMatches.length === 0) return false;
  return roundMatches.every(m => m.status === 'completed');
}

/**
 * Gets the current round number for a bracket tournament
 * (the first incomplete round, or the last round if all complete).
 *
 * Important caveat: if the first incomplete round has TBD players
 * (placeholders, because advance_bracket_round_rpc hasn't been called yet),
 * we return the previous round instead. That keeps the UI from rendering
 * a TBD vs TBD match as editable — the user has to hit "Advance to next
 * round" first so the winners get filled in.
 */
export function getCurrentBracketRound(matches: BracketMatch[]): number {
  const maxRound = Math.max(...matches.map(m => m.round));

  for (let round = 1; round <= maxRound; round++) {
    if (!isRoundComplete(matches, round)) {
      const roundMatches = matches.filter(m => m.round === round);
      const hasPlaceholders = roundMatches.some(
        m => !m.playerA?.id || !m.playerB?.id
      );
      if (hasPlaceholders && round > 1) {
        return round - 1;
      }
      return round;
    }
  }

  return maxRound; // All rounds complete
}

/**
 * Gets the total number of rounds in a bracket tournament
 */
export function getTotalBracketRounds(playerCount: number): number {
  if (playerCount === 2) return 1;
  return Math.log2(playerCount);
}

/**
 * Validates if a bracket can be advanced to the next round
 */
export function canAdvanceBracketRound(matches: BracketMatch[], currentRound: number): boolean {
  return isRoundComplete(matches, currentRound);
}

/**
 * Gets match result as a display string
 */
export function formatMatchResult(result: MatchResult, hasScore: boolean): string {
  if (!result) return '-';

  if (result.type === 'score') {
    return `${result.scoreA} - ${result.scoreB}`;
  } else if (result.type === 'winloss') {
    if (result.winner === 'A') return 'A wins';
    if (result.winner === 'B') return 'B wins';
    return 'Draw';
  }

  return '-';
}
