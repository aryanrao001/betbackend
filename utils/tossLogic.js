// utils/tossLogic.js

// Calculate toss result based on currentBets
export function calculateTossResult(bets) {
  const totalHeads = bets.heads.reduce((sum, bet) => sum + bet.amount, 0);
  const totalTails = bets.tails.reduce((sum, bet) => sum + bet.amount, 0);

  let result;
  if (totalHeads < totalTails) {
    result = 'heads';
  } else if (totalTails < totalHeads) {
    result = 'tails';
  } else {
    result = Math.random() < 0.5 ? 'heads' : 'tails';
  }

  return {
    success: true,
    message: `✅ Result declared successfully: ${result.toUpperCase()}`,
    result,
    totalHeads,
    totalTails,
  };
}
