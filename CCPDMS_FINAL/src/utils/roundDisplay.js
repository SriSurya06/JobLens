function normalizeRoundNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resolveDisplayRoundNumber(application) {
  if (!application || typeof application !== 'object') return null;

  const roundStatuses = Array.isArray(application.roundStatuses)
    ? application.roundStatuses
    : [];

  const validRoundNumbers = roundStatuses
    .map((status) => normalizeRoundNumber(status?.roundNumber))
    .filter((roundNumber) => roundNumber !== null);

  if (validRoundNumbers.length) {
    return Math.max(...validRoundNumbers);
  }

  const eliminatedAtRound = normalizeRoundNumber(application.eliminatedAtRound);
  if (eliminatedAtRound !== null) {
    return eliminatedAtRound;
  }

  return null;
}

module.exports = {
  resolveDisplayRoundNumber,
  normalizeRoundNumber,
};
