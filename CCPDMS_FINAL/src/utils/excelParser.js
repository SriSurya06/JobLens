const xlsx = require('xlsx');

/**
 * Parse an Excel (.xlsx / .xls) file and extract roll numbers.
 * Accepted column headers (case-insensitive): any header containing "roll"
 * e.g. RollNumber | Roll No | roll_number
 * Returns a de-duplicated array of UPPERCASE strings.
 */
const parseRollNumbers = (filePath) => {
  const workbook  = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows      = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (!rows.length) throw new Error('Excel file is empty — no data rows found');
  const headers = Object.keys(rows[0]);
  const rollCol = headers.find((h) => /roll/i.test(h));
  if (!rollCol)
    throw new Error(
      'Roll number column not found. Accepted headers: "RollNumber", "Roll No", "roll_number"'
    );
  const rolls = rows
    .map((r) => String(r[rollCol]).trim().toUpperCase())
    .filter((r) => r && r !== 'UNDEFINED' && r !== '' && r !== 'NAN');
  if (!rolls.length)
    throw new Error('Roll number column found but contains no valid values');

  return [...new Set(rolls)];
};
module.exports = { parseRollNumbers };