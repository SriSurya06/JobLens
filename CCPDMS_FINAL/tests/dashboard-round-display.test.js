const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveDisplayRoundNumber } = require('../src/utils/roundDisplay');

test('uses the highest valid round recorded in the application timeline, even if the elimination field is stale', () => {
  const application = {
    overallStatus: 'rejected',
    eliminatedAtRound: 10,
    roundStatuses: [
      { roundNumber: 1, status: 'qualified' },
      { roundNumber: 2, status: 'qualified' },
    ],
  };

  assert.equal(resolveDisplayRoundNumber(application), 2);
});

test('ignores array order and resolves the highest valid round from the timeline', () => {
  const application = {
    overallStatus: 'in_progress',
    roundStatuses: [
      { roundNumber: 1, status: 'qualified' },
      { roundNumber: 4, status: 'qualified' },
      { roundNumber: 2, status: 'eligible' },
    ],
  };

  assert.equal(resolveDisplayRoundNumber(application), 4);
});

test('falls back to the elimination round when the application has no round history', () => {
  const application = {
    overallStatus: 'in_progress',
    eliminatedAtRound: 2,
    roundStatuses: [],
  };

  assert.equal(resolveDisplayRoundNumber(application), 2);
});

test('returns null when no round data exists', () => {
  const application = { overallStatus: 'registered' };

  assert.equal(resolveDisplayRoundNumber(application), null);
});
