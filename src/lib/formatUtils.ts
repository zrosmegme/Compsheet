// Utility function to detect column format based on name and sample values
export const detectColumnFormat = (columnName: string, values: any[]) => {
    const lowerName = columnName.toLowerCase();

    // Check for ratio/multiple columns FIRST (before currency check)
    if (lowerName.includes('ev/') ||
        lowerName.includes('/rev') ||
        lowerName.includes('/fcf') ||
        lowerName.includes('/ebitda') ||
        lowerName.includes('/g') ||
        lowerName.includes('ratio') ||
        lowerName.includes('multiple')) {
        return 'decimal';
    }

    // Check for percentage columns
    if (lowerName.includes('margin') || lowerName.includes('growth') || lowerName.includes('%') || lowerName.includes('yield') || lowerName.includes('roe') || lowerName.includes('roa')) {
        // Determine if values are decimal (0.15) or whole (15.5)
        const numericValues = values.map(v => {
            if (typeof v === 'number') return v;
            return Number(String(v).replace(/[^0-9.\-]/g, ''));
        }).filter(n => !isNaN(n));

        if (numericValues.length > 0) {
            // Calculate median absolute value
            const sorted = numericValues.map(Math.abs).sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];

            // If median is small (< 2), assume decimal format (e.g. 0.15 = 15%, 1.3 = 130%)
            // If median is large (> 2), assume whole number format (e.g. 15 = 15%)
            if (median < 2) {
                return 'percentage_decimal';
            }
        }
        return 'percentage';
    }

    // Check for currency columns
    if (lowerName.includes('$') || lowerName.includes('price') ||
        lowerName.includes('cap') || lowerName.includes('revenue') ||
        lowerName.includes('fcf') || lowerName.includes('ebitda') ||
        lowerName.includes('ev (')) {  // Only match "EV ($M)" not "EV/Rev"

        // Determine if values are in Millions (100 = $100M) or Ones (100,000,000 = $100M)
        const numericValues = values.map(v => {
            if (typeof v === 'number') return v;
            return Number(String(v).replace(/[^0-9.\-]/g, ''));
        }).filter(n => !isNaN(n));

        if (numericValues.length > 0) {
            const sorted = numericValues.map(Math.abs).sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];

            // If median is relatively small (< 10,000), assume Millions
            // Public companies usually have > $10M revenue. If data is 10, it's likely $10M.
            // If data was ones, it would be 10,000,000.
            if (median < 10000) {
                return 'currency_millions';
            }
        }
        return 'currency';
    }

    // Default - check if numeric
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (numericValues.length > values.length * 0.5) {
        return 'number';
    }

    return 'text';
};

// Format a value based on its detected type
export const formatValue = (value: any, format: string): string => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    // Handle error values from Excel
    if (typeof value === 'string' && value.includes('#N/A')) {
        return 'N/A';
    }

    const numValue = Number(value);

    switch (format) {
        case 'percentage_decimal':
            if (isNaN(numValue)) return String(value);
            return (numValue * 100).toFixed(1) + '%';

        case 'percentage':
            if (isNaN(numValue)) return String(value);
            return numValue.toFixed(1) + '%';

        case 'currency_millions':
            if (isNaN(numValue)) return String(value);
            if (Math.abs(numValue) >= 1000) {
                return '$' + (numValue / 1000).toFixed(1) + 'B';
            }
            return '$' + numValue.toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'M';

        case 'currency':
            if (isNaN(numValue)) return String(value);
            if (Math.abs(numValue) >= 1.0e9) {
                return '$' + (numValue / 1.0e9).toFixed(1) + 'B';
            } else if (Math.abs(numValue) >= 1.0e6) {
                return '$' + (numValue / 1.0e6).toFixed(1) + 'M';
            } else if (Math.abs(numValue) >= 1.0e3) {
                return '$' + (numValue / 1.0e3).toFixed(0) + 'k';
            }
            return '$' + numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        case 'decimal':
            if (isNaN(numValue)) return String(value);
            // For multiples, show 1 decimal place with commas
            if (numValue >= 100) {
                return numValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x';
            } else if (numValue >= 10) {
                return numValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x';
            }
            return numValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x';

        case 'number':
            if (isNaN(numValue)) return String(value);
            // Show commas for whole numbers
            return numValue.toLocaleString(undefined, { maximumFractionDigits: 0 });

        default:
            return String(value);
    }
};

// Create a format map for all columns
export const createFormatMap = (data: any[]) => {
    if (data.length === 0) return {};

    const formatMap: Record<string, string> = {};
    const columns = Object.keys(data[0]);

    columns.forEach(col => {
        const values = data.map(row => row[col]).filter(v => v !== undefined && v !== '');
        formatMap[col] = detectColumnFormat(col, values);
    });

    return formatMap;
};
