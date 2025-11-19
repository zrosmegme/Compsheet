import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '..', 'Searchcomps Values.xlsx'));

console.log('Available sheets:');
workbook.SheetNames.forEach((name, index) => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`  ${index + 1}. "${name}" - ${data.length} rows`);
});
