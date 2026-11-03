import * as XLSX from 'xlsx';

/**
 * Utility function to export tabular data to an Excel (.xlsx) file
 * @param {Array<Array<any>> | Array<Record<string, any>>} data 
 * @param {string} fileName 
 * @param {string} sheetName 
 * @param {Array<{wch: number} | number>} colWidths 
 */
export const exportToExcel = (data, fileName = 'export.xlsx', sheetName = 'Sheet1', colWidths = []) => {
  const ws = Array.isArray(data) && Array.isArray(data[0]) 
    ? XLSX.utils.aoa_to_sheet(data)
    : XLSX.utils.json_to_sheet(data);

  if (colWidths && colWidths.length > 0) {
    ws['!cols'] = colWidths.map(w => typeof w === 'number' ? { wch: w } : w);
  }

  // Ensure text formatting for numeric-like strings (NIM, NIP, Phone numbers) to avoid scientific notation
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = ws[cell_ref];
        if (cell && typeof cell.v === 'string') {
          const trimmed = cell.v.replace(/^'/, '').trim();
          if (/^\d{8,}$/.test(trimmed) || /^08\d+/.test(trimmed)) {
            cell.v = trimmed;
            cell.t = 's';
            cell.z = '@';
          }
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

/**
 * Utility function to read an Excel (.xlsx, .xls) or CSV file in the browser
 * @param {File} file 
 * @returns {Promise<Array<Record<string, any>>>}
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('File tidak ditemukan.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('File tidak memiliki lembar kerja (sheet).');
        }
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        resolve(rawJson);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

