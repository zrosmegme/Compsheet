# Compsheet

A modern React application for advanced data filtering and visualization, specifically designed for analyzing company comparables data.

## Features

- 📊 **Excel/CSV Upload**: Import data from Excel or CSV files
- 🔍 **Advanced Filtering**: Multi-criteria filtering with AND logic
  - Numeric range filters (min/max)
  - Text-based partial matching
  - Auto-detection of column types (numeric vs text)
- 📈 **Interactive Scatter Chart**: 
  - Customizable X and Y axes
  - Ticker labels on data points
  - Smart formatting for different data types
- 📋 **Sortable Data Table**: Click column headers to sort
- 💾 **State Persistence**: All filters and data saved to browser localStorage
- 🎨 **Premium Dark UI**: Modern glassmorphism design with smooth animations

## Smart Formatting

The app automatically detects and formats different data types:
- **Currency**: $400.4B, $3,896.2M
- **Percentages**: 48.2%, 82.9%
- **Multiples/Ratios**: 68.2x, 139.1x
- **Numbers**: 168,065 (with thousand separators)

## Tech Stack

- **React** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Chart visualization
- **XLSX** - Excel file parsing
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Upload Data**: Drag & drop or click to upload an Excel/CSV file
2. **Add Filters**: Click "Add Criteria" to create filters
   - Select column
   - Enter min/max values (for numeric columns)
   - Enter text for partial matching (for text columns)
3. **Visualize**: Select X and Y axes for the scatter chart
4. **Sort**: Click any column header in the table to sort
5. **Persist**: All your settings are automatically saved

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx      # File upload with drag & drop
│   ├── CriteriaPanel.tsx   # Filter criteria management
│   ├── DataTable.tsx       # Sortable data table
│   └── ScatterChart.tsx    # Interactive scatter chart
├── lib/
│   ├── formatUtils.ts      # Data formatting utilities
│   └── utils.ts            # General utilities
├── types.ts                # TypeScript type definitions
└── App.tsx                 # Main application component
```

## License

MIT
