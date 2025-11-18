import React, { useCallback } from 'react';

// I'll stick to standard input for now to avoid another install round, or just use a simple drag/drop implementation.
// Actually, standard input is safer for now. I'll make it look good.
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
    onDataLoaded: (data: any[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
    const handleFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;

            const workbook = XLSX.read(data, { type: 'binary' });

            // Parse Data Sheet
            const dataSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('data'));
            let parsedData: any[] = [];
            if (dataSheetName) {
                const dataSheet = workbook.Sheets[dataSheetName];
                // The Excel file structure:
                // Row 0: Column numbers (1, 2, 3...)
                // Row 1: Actual headers ("Ticker", "Long Name"...)
                // Row 2+: Data rows
                const rawData = XLSX.utils.sheet_to_json(dataSheet, { header: 1, defval: '' });

                if (rawData.length > 2) {
                    // Use row 1 (index 1) as headers, skip row 0
                    const headers = rawData[1] as any[];
                    const dataRows = rawData.slice(2) as any[][];

                    // Convert to objects using row 1 as keys
                    parsedData = dataRows.map(row => {
                        const obj: any = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                    });
                }
            }



            onDataLoaded(parsedData);
        };
        reader.readAsBinaryString(file);
    }, [onDataLoaded]);

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-accent transition-colors cursor-pointer bg-slate-900/50 backdrop-blur-sm group"
        >
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-slate-800 rounded-full group-hover:bg-slate-700 transition-colors">
                    <FileSpreadsheet className="w-8 h-8 text-accent" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Upload Data File</h3>
                    <p className="text-slate-400 text-sm mt-1">Drag & drop or click to browse</p>
                    <p className="text-slate-500 text-xs mt-2">Supports .xlsx, .csv</p>
                </div>
            </label>
        </div>
    );
};
