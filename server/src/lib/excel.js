// Excel (.xlsx) helpers built on exceljs — generate workbooks from rows and
// parse uploaded workbooks back into rows.
import ExcelJS from 'exceljs';

/**
 * @param {string} sheetName
 * @param {Array<{key:string,header:string}>} columns
 * @param {Array<object>} rows
 * @returns {Promise<Buffer>}
 */
export async function rowsToXlsx(sheetName, columns, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wellspire Platform';
  wb.created = new Date();
  const ws = wb.addWorksheet((sheetName || 'Sheet1').slice(0, 30));
  ws.columns = columns.map((c) => ({ header: c.header || c.key, key: c.key, width: Math.max(14, (c.header || c.key).length + 4) }));
  for (const r of rows) ws.addRow(r);
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF233F88' } };
  header.alignment = { vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** Parse the first worksheet of an xlsx buffer into { headers, rows }. */
export async function xlsxToRows(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };
  const headers = [];
  ws.getRow(1).eachCell((cell, col) => { headers[col - 1] = String(cellValue(cell.value) ?? '').trim(); });
  const rows = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const obj = {};
    let any = false;
    headers.forEach((h, idx) => {
      if (!h) return;
      const v = cellValue(row.getCell(idx + 1).value);
      if (v !== null && v !== undefined && v !== '') any = true;
      obj[h] = v;
    });
    if (any) rows.push(obj);
  }
  return { headers, rows };
}

function cellValue(v) {
  if (v && typeof v === 'object') {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if ('text' in v) return v.text;
    if ('result' in v) return v.result;
    if ('richText' in v) return v.richText.map((t) => t.text).join('');
    if ('hyperlink' in v) return v.text || v.hyperlink;
  }
  return v;
}

export default { rowsToXlsx, xlsxToRows };
