const test = require('node:test');
const assert = require('node:assert/strict');

const OffCampusDrive = require('../src/models/OffCampusDrive');
const AuditLog = require('../src/models/AuditLog');
const { updateDrive } = require('../src/controllers/offcampus.controller');

const originalFindByIdAndUpdate = OffCampusDrive.findByIdAndUpdate;
const originalAuditLogCreate = AuditLog.create;

test('updateDrive accepts editable off-campus fields and preserves category/batches/branches', async () => {
  let savedArgs = null;
  let auditArgs = null;

  OffCampusDrive.findByIdAndUpdate = async (id, updates, options) => {
    savedArgs = { id, updates, options };
    return {
      _id: id,
      ...updates.$set,
    };
  };

  AuditLog.create = async (payload) => {
    auditArgs = payload;
    return payload;
  };

  const req = {
    params: { id: 'drive-123' },
    body: {
      companyName: 'Google',
      driveName: 'SDE Intern',
      driveCategory: 'job',
      eligibleBatches: [2026, 2027],
      eligibleBranches: ['CSE', 'IT'],
      applyLink: 'https://example.com/apply',
      lastDateToApply: '2026-12-31',
      description: 'Updated role details',
    },
    user: { _id: 'user-123' },
    ip: '127.0.0.1',
  };

  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
    },
  };

  let nextCalled = false;
  const next = (err) => {
    nextCalled = true;
    throw err;
  };

  try {
    await updateDrive(req, res, next);
    assert.equal(nextCalled, false);
    assert.deepEqual(savedArgs.updates.$set.companyName, 'Google');
    assert.deepEqual(savedArgs.updates.$set.driveCategory, 'job');
    assert.deepEqual(savedArgs.updates.$set.eligibleBatches, [2026, 2027]);
    assert.deepEqual(savedArgs.updates.$set.eligibleBranches, ['CSE', 'IT']);
    assert.equal(savedArgs.updates.$set.lastDateToApply instanceof Date, true);
    assert.equal(res.code, 200);
    assert.equal(auditArgs.entity, 'OffCampusDrive');
  } finally {
    OffCampusDrive.findByIdAndUpdate = originalFindByIdAndUpdate;
    AuditLog.create = originalAuditLogCreate;
  }
});
