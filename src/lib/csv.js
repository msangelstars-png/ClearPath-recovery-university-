export function toCSV(rows, columns) {
  if (!rows?.length) return '';
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  );
  return [header, ...body].join('\n');
}

export function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
