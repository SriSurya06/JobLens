const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');

const normalizeRollNumber = (value) => {
  if (value === undefined || value === null) return null;

  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
};

const extractFromExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Excel file does not contain a worksheet');
  }

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
  });

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
    'roll_number',
  ];

  const rollNumbers = [];

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

const extractFromPdf = async (filePath) => {
  const buffer = fs.readFileSync(filePath);

  const data = await pdfParse(buffer);

  const text = data.text || '';

  const matches =
    text.match(/\b[A-Z0-9]{6,20}\b/gi) || [];

  return [
    ...new Set(
      matches
        .map(normalizeRollNumber)
        .filter(Boolean)
    ),
  ];
};

const extractFromText = (text) => {
  if (!text || !text.trim()) {
    return [];
  }

  const tokens = text
    .split(/[\s,;|]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const rollNumbers = tokens
    .map(normalizeRollNumber)
    .filter(Boolean)
    .filter((value) => /^[A-Z0-9]{6,20}$/.test(value));

  return [...new Set(rollNumbers)];
};

const extractRoundResultRollNumbers = async ({
  filePath,
  text,
}) => {
  if (text && text.trim()) {
    return extractFromText(text);
  }

  if (!filePath) {
    throw new Error(
      'Upload an Excel/PDF file or enter roll numbers manually'
    );
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
    'Unsupported result format. Use XLS, XLSX, or PDF.'
  );
};

module.exports = {
  extractRoundResultRollNumbers,
};