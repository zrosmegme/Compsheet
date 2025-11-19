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
    if (lowerName.includes('margin') || lowerName.includes('growth') || lowerName.includes('%')) {
        return 'percentage';
    }

    // Check for currency columns
    if (lowerName.includes('$') || lowerName.includes('price') ||
        lowerName.includes('cap') || lowerName.includes('revenue') ||
        lowerName.includes('fcf') || lowerName.includes('ebitda') ||
        lowerName.includes('ev (')) {  // Only match "EV ($M)" not "EV/Rev"
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
        case 'percentage':
            if (isNaN(numValue)) return String(value);
            // If value is between 0 and 1, treat as decimal percentage
            if (numValue >= 0 && numValue <= 1) {
                return (numValue * 100).toFixed(1) + '%';
            }
            // Otherwise already a percentage
            return numValue.toFixed(1) + '%';

        case 'currency':
            if (isNaN(numValue)) return String(value);
            if (numValue >= 1000000) {
                return '$' + (numValue / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'B';
            } else if (numValue >= 1000) {
                return '$' + numValue.toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'M';
            }
            return '$' + numValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

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
