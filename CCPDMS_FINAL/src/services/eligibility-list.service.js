const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');

/**
 * Normalize a roll number so Excel/PDF formatting differences
 * don't prevent matching.
 */
const normalizeRollNumber = (value) => {
  if (value === undefined || value === null) return null;

  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
};

/**
 * Extract roll numbers from an Excel file.
 *
 * Expected format can be:
 * Roll Number
 * 23MH1A05M8
 * 23MH1A05M9
 *
 * The parser also checks common column names.
 */
const extractFromExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Eligibility Excel file does not contain a worksheet');
  }

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
  });

  const rollNumbers = [];

  const possibleColumns = [
    'rollNumber',
    'Roll Number',
    'ROLL NUMBER',
    'RollNumber',
    'roll number',
    'roll_no',
    'Roll No',
    'ROLL NO',
    'rollNo',
  ];

  for (const row of rows) {
    let value = null;

    for (const column of possibleColumns) {
      if (row[column] !== undefined && row[column] !== '') {
        value = row[column];
        break;
      }
    }

    if (value !== null) {
      const normalized = normalizeRollNumber(value);

      if (normalized) {
        rollNumbers.push(normalized);
      }
    }
  }

  return [...new Set(rollNumbers)];
};

/**
 * Extract roll numbers from a PDF.
 *
 * The PDF text is scanned for values that look like
 * student roll numbers.
 */
const extractFromPdf = async (filePath) => {
  const buffer = fs.readFileSync(filePath);

  const data = await pdfParse(buffer);

  const text = data.text || '';

  /*
   * Matches roll numbers such as:
   * 23MH1A05M8
   * 23MH1A05N9
   *
   * The pattern is intentionally based on the roll-number
   * format used by the Student model/project.
   */
  const matches = text.match(/\b[A-Z0-9]{6,20}\b/gi) || [];

  return [
    ...new Set(
      matches
        .map(normalizeRollNumber)
        .filter(Boolean)
    ),
  ];
};

/**
 * Extract student roll numbers from an eligibility list.
 *
 * Supports:
 * - XLS
 * - XLSX
 * - PDF
 */
const extractEligibilityRollNumbers = async (filePath) => {
  if (!filePath) {
    throw new Error('Eligibility list file path is required');
  }

  const extension = path
    .extname(filePath)
    .toLowerCase();

  if (extension === '.xlsx' || extension === '.xls') {
    return extractFromExcel(filePath);
  }

  if (extension === '.pdf') {
    return extractFromPdf(filePath);
  }

  throw new Error(
    'Unsupported eligibility list format. Use XLS, XLSX, or PDF.'
  );
};

module.exports = {
  extractEligibilityRollNumbers,
};