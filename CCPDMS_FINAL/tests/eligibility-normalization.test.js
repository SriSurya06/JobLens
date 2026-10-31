const test = require('node:test');
const assert = require('node:assert/strict');

const {
  driveMatchesStudent,
  normalizeDriveEligibility,
} = require('../src/services/filter.service');

test('normalizes mixed-case batch and branch values for student visibility', () => {
  const drive = {
    eligibleBatches: [' 2026 ', 2027],
    eligibleBranches: [' cse ', 'ECE'],
    cgpaCutOff: 6.0,
    backlogsAllowed: 0,
  };

  const student = {
    passedOutYear: 2026,
    branch: 'CSE',
    cgpa: 7.5,
    activeBacklogs: 0,
  };

  assert.deepEqual(normalizeDriveEligibility(drive), {
    batches: [2026, 2027],
    branches: ['CSE', 'ECE'],
  });
  assert.equal(driveMatchesStudent(drive, student), true);
});

test('returns false when a valid drive is outside the student eligibility window', () => {
  const drive = {
    eligibleBatches: ['2027'],
    eligibleBranches: ['ECE'],
    cgpaCutOff: 8.0,
    backlogsAllowed: 0,
  };

  const student = {
    passedOutYear: 2026,
    branch: 'CSE',
    cgpa: 7.5,
    activeBacklogs: 0,
  };

  assert.equal(driveMatchesStudent(drive, student), false);
});
