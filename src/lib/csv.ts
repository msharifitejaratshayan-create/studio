function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let currentField = '';
    let inQuotedField = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotedField && i + 1 < line.length && line[i + 1] === '"') {
                currentField += '"';
                i++; // Skip the second quote in a pair
            } else {
                inQuotedField = !inQuotedField;
            }
        } else if (char === ',' && !inQuotedField) {
            result.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    result.push(currentField);
    return result;
}

export function parseCsv(csvString: string): { headers: string[]; data: Record<string, string>[] } {
  const lines = csvString.trim().split('\n');
  if (lines.length < 1) {
    throw new Error('CSV is empty or invalid.');
  }

  const headers = parseCsvLine(lines[0].trim());
  const data = lines.slice(1).map(line => {
    if (line.trim() === '') return null;
    const values = parseCsvLine(line.trim());
    if (values.length > 0 && values.length !== headers.length) {
       console.warn(`Skipping malformed row. Expected ${headers.length} fields, but got ${values.length}. Row: ${line}`);
       return null;
    }
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {} as Record<string, string>);
  }).filter(row => row !== null) as Record<string, string>[];

  return { headers, data };
}

export function exportToCsv(filename: string, headers: string[], data: Record<string, any>[]) {
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
