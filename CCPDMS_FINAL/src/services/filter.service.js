
/**
 * Return all Student docs that match an OnCampusDrive's eligibility criteria.
 */
const Student = require('../models/Student');

const normalizeBatch = (value) => {
  const asNumber = Number(String(value ?? '').trim());
  return Number.isFinite(asNumber) ? asNumber : null;
};

const normalizeBranch = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const normalizeDriveEligibility = (drive = {}) => {
  const batches = (Array.isArray(drive.eligibleBatches)
    ? drive.eligibleBatches
    : [drive.eligibleBatches])
    .map(normalizeBatch)
    .filter((b) => b !== null);

  const branches = (Array.isArray(drive.eligibleBranches)
    ? drive.eligibleBranches
    : [drive.eligibleBranches])
    .map(normalizeBranch)
    .filter(Boolean);

  return {
    batches: [...new Set(batches)],
    branches: [...new Set(branches)],
  };
};

const driveMatchesStudent = (drive = {}, student = {}) => {
  const { batches, branches } = normalizeDriveEligibility(drive);
  const studentBatch = normalizeBatch(student.passedOutYear);
  const studentBranch = normalizeBranch(student.branch);

  if (studentBatch === null || !studentBranch) {
    return false;
  }

  const matchesProfile =
    batches.includes(studentBatch) &&
    branches.includes(studentBranch);

  const qualifiesOnCgpa =
    Number(student.cgpa ?? 0) >= Number(drive.cgpaCutOff ?? 0);
  const qualifiesOnBacklogs =
    Number(student.activeBacklogs ?? 0) <= Number(drive.backlogsAllowed ?? 999);

  return matchesProfile && qualifiesOnCgpa && qualifiesOnBacklogs;
};

/**
 * Return all Student docs that match an OnCampusDrive's
 * normal eligibility criteria AND, when provided, the
 * uploaded student eligibility list.
 */
const filterEligibleStudents = async (drive) => {
  const { batches, branches } = normalizeDriveEligibility(drive);
  const filter = {
    passedOutYear: { $in: batches },
    branch: { $in: branches },
    cgpa: { $gte: drive.cgpaCutOff ?? 0 },
    activeBacklogs: { $lte: drive.backlogsAllowed ?? 999 },
  };

  // If an eligibility list was uploaded,
  // the student must also be present in that list.
  if (
    Array.isArray(drive.eligibleStudentRollNumbers) &&
    drive.eligibleStudentRollNumbers.length > 0
  ) {
    filter.rollNumber = {
      $in: drive.eligibleStudentRollNumbers,
    };
  }

  return Student.find(filter).select(
    '_id rollNumber name collegeEmail cgpa activeBacklogs branch passedOutYear'
  );
};

/**
 * Check whether a single student is eligible for a drive.
 */
const isStudentEligible = (student, drive) => {
  const baseMatch = driveMatchesStudent(drive, student);

  if (!baseMatch) {
    return false;
  }

  // If a student eligibility list exists,
  // the student's roll number must be present in it.
  if (
    Array.isArray(drive.eligibleStudentRollNumbers) &&
    drive.eligibleStudentRollNumbers.length > 0
  ) {
    return drive.eligibleStudentRollNumbers.includes(
      String(student.rollNumber).trim().toUpperCase()
    );
  }

  // No uploaded list → normal criteria alone decide eligibility.
  return true;
};

module.exports = {
  filterEligibleStudents,
  isStudentEligible,
  driveMatchesStudent,
  normalizeDriveEligibility,
};
