import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '..', 'Searchcomps Values.xlsx'));

console.log('Available sheets:', workbook.SheetNames);

// Use the "Data" sheet specifically
const sheetName = 'Data';
if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`❌ Sheet "${sheetName}" not found!`);
    console.log('Available sheets:', workbook.SheetNames);
    process.exit(1);
}

const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

// Create the data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Write to JSON file
const outputPath = path.join(dataDir, 'default-data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`✅ Converted "${sheetName}" to JSON: ${data.length} rows`);
console.log(`📁 Saved to: ${outputPath}`);
