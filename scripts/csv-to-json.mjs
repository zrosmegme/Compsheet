import fs from 'fs';

const csv = fs.readFileSync('data/screenshots-data.csv', 'utf-8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');

const data = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((h, i) => {
    let val = values[i] || '';

    // Remove $ and convert numbers with b/m suffixes
    if (val.startsWith('$')) {
      val = val.replace(/[\$,]/g, '');
      if (val.endsWith('b')) {
        val = parseFloat(val) * 1e9;
      } else if (val.endsWith('m')) {
        val = parseFloat(val) * 1e6;
      } else {
        val = parseFloat(val);
      }
    } else if (val.endsWith('%')) {
      // Convert percentage to decimal
      val = parseFloat(val.replace('%', '')) / 100;
    } else if (val.endsWith('x')) {
      // Keep multiples as numbers
      val = parseFloat(val.replace('x', ''));
    } else if (val === '-' || val === '') {
      val = null;
    } else if (!isNaN(parseFloat(val)) && h !== 'Ticker') {
      val = parseFloat(val);
    }
    obj[h] = val;
  });
  return obj;
});

fs.writeFileSync('src/data/default-data.json', JSON.stringify(data, null, 2));
console.log('Converted ' + data.length + ' rows to JSON');
