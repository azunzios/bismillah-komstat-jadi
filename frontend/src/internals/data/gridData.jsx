import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ReactCountryFlag from 'react-country-flag';
import {
  GlobeFlag,
} from '../components/CustomIcons';

export const columns = [
  {
    field: 'countryName',
    headerName: 'Nama Negara',
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>{params.value}</span>
      </Box>
    ),
  },
  {
    field: 'countryCode',
    headerName: 'Kode Negara',
    flex: 0.8,
    minWidth: 100,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {params.value === 'WLD' ? (
          <GlobeFlag />
        ) : (
          <ReactCountryFlag
            countryCode={EmissionDataManager.instance.alpha3ToAlpha2[params.value] || params.value.toLowerCase()}
            svg
            style={{
              width: '1.5em',
              height: '1em',
              borderRadius: '2px',
              boxShadow: '0 0 1px 0px #888',
            }}
            title={params.row.countryName || params.value}
          />
        )}
        <span>{params.value}</span>
      </Box>
    ),
  },
  {
    field: 'totalGHGE',
    headerName: 'Total GHGE',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'n2oGE',
    headerName: 'N2O GE',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'co2GE',
    headerName: 'CO2 GE',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'ch4GE',
    headerName: 'CH4 GE',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'otherGE',
    headerName: 'Other GE',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'year',
    headerName: 'Year',
    headerAlign: 'right',
    align: 'right',
    flex: 0.5,
    minWidth: 80,
  },
  {
    field: 'growth',
    headerName: 'Daily Conversions',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      const value = params.value || 0;
      const isPositive = value > 0;
      const color = isPositive ? '#ff4d4f' : '#52c41a';
      const Icon = isPositive ? ArrowUpwardIcon : ArrowDownwardIcon;
      const displayValue = isPositive ? `+${value}%` : `${value}%`;

      return (
        <Box sx={{ color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
          <span style={{ marginRight: 4 }}>{displayValue}</span>
          <Icon sx={{ fontSize: 16 }} />
        </Box>
      );
    },
  },
];

// Singleton manager for emission data
class EmissionDataManager {
  static instance;

  constructor() {
    this.data = [];
    this.isLoaded = false;
    this.alpha3ToAlpha2 = {}; // Store alpha3 to alpha2 mapping
  }

  static getInstance() {
    if (!EmissionDataManager.instance) {
      EmissionDataManager.instance = new EmissionDataManager();
    }
    return EmissionDataManager.instance;
  }

  async loadData() {
    if (this.isLoaded && this.data.length > 0) {
      return this.data;
    }

    try {
      const codesRes = await fetch('http://localhost:8000/country-code-and-numeric.json');
      const codes = await codesRes.json();
      const countryMap = {};
      this.alpha3ToAlpha2 = {}; // Reset and populate the mapping
      
      codes.forEach(country => {
        if (country.alpha2 && country.alpha3) {
          countryMap[country.alpha3] = country.name;
          this.alpha3ToAlpha2[country.alpha3] = country.alpha2.toLowerCase();
        }
      });

      const emissionsRes = await fetch('http://localhost:8000/global-complete-data.json');
      const emissionsData = await emissionsRes.json();

      const transformed = [];
      const MIN_YEAR = 1970;

      Object.entries(emissionsData).forEach(([countryCode, yearsData]) => {
        const countryName = countryMap[countryCode] || 'Unknown';
        const years = Object.keys(yearsData)
          .map(Number)
          .filter(year => year >= MIN_YEAR)
          .sort((a, b) => b - a); // Sort years in descending order

        if (!years.length) return;

        years.forEach((year, index) => {
          const yearData = yearsData[year] || {};
          let growth = 0;

          // Calculate growth from previous year if available
          if (index < years.length - 1) {
            const prevYear = years[index + 1];
            const prevData = yearsData[prevYear] || {};
            const currentTotal = yearData.total || 0;
            const prevTotal = prevData.total || 0;
            growth = prevTotal !== 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
          }

          transformed.push({
            id: `${countryCode}-${year}`, // Unique ID combining country and year
            countryName,
            countryCode,
            totalGHGE: yearData.total || 0,
            n2oGE: yearData.n2o || 0,
            co2GE: yearData.co2 || 0,
            ch4GE: yearData.ch4 || 0,
            otherGE: yearData.total- (yearData.co2 + yearData.n2o + yearData.ch4) || 0,
            year: year,
            growth: parseFloat(growth.toFixed(2)),
          });
        });
      });

      this.data = transformed;
      this.isLoaded = true;
      console.log('Data loaded:', this.data);
      return this.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      const fallback = [
        {
          id: 'WLD',
          countryName: 'World',
          countryCode: 'WLD',
          totalGHGE: 0,
          n2oGE: 0,
          co2GE: 0,
          ch4GE: 0,
          otherGE: 0,
          year: 2020,
          growth: 1,
        },
      ];
      this.data = fallback;
      this.isLoaded = true;
      return this.data;
    }
  }

  getData() {
    return this.data;
  }

  isDataLoaded() {
    return this.isLoaded;
  }
}

// Initialize array with fallback data
export let rows = [
  {
    id: 'WLD',
    countryName: 'World',
    countryCode: 'WLD',
    totalGHGE: 0,
    n2oGE: 0,
    co2GE: 0,
    ch4GE: 0,
    otherGE: 0,
    year: 2020,
    growth: 1,
  },
];

// Function to update the exported rows array
export function updateRows(newData) {
  try {
    // Method 1: Try splice first
    rows.length = 0; // Clear array
    rows.push(...newData);
    console.log('Rows updated with splice:', rows.length, 'items');
  } catch (error) {
    console.warn('Splice failed, using reassignment:', error.message);
    // Method 2: Reassign if splice fails
    rows = [...newData];
    console.log('Rows updated with reassignment:', rows.length, 'items');
  }
}

// Custom hook to use emission data
export function useEmissionData() {
  const [localRows, setLocalRows] = useState(() => {
    // Initialize with default data
    return [{
      id: 'WLD',
      countryName: 'World',
      countryCode: 'WLD',
      totalGHGE: 0,
      n2oGE: 0,
      co2GE: 0,
      ch4GE: 0,
      otherGE: 0,
      year: new Date().getFullYear(),
      growth: 0,
    }];
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        const manager = EmissionDataManager.getInstance();
        const data = await manager.loadData();
        
        if (!isMounted) return;
        
        // Update local state for this hook
        setLocalRows(data);
        
        // Update the exported rows array
        updateRows(data);
        
      } catch (err) {
        console.error('Error in useEmissionData:', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  return { 
    rows: localRows, 
    loading, 
    error,
    // Add a refetch function in case we need to reload the data
    refetch: () => {
      setLoading(true);
      setError(null);
      return EmissionDataManager.getInstance().loadData()
        .then(data => {
          setLocalRows(data);
          updateRows(data);
          return data;
        })
        .catch(err => {
          console.error('Error refetching data:', err);
          setError(err);
          throw err;
        })
        .finally(() => setLoading(false));
    }
  };
}

// Async getter for rows
export async function getEmissionRows() {
  const manager = EmissionDataManager.getInstance();
  return await manager.loadData();
}

// Synchronous getter
export function getRowsSync() {
  const manager = EmissionDataManager.getInstance();
  if (manager.isDataLoaded()) {
    return manager.getData();
  }
  return [
    {
      id: 'WLD',
      countryName: 'World',
      countryCode: 'WLD',
      totalGHGE: 0,
      n2oGE: 0,
      co2GE: 0,
      ch4GE: 0,
      otherGE: 0,
      year: 2020,
      growth: 1,
    },
  ];
}

// Auto-load data when module is imported
(async () => {
  try {
    console.log('Starting auto-load...');
    const manager = EmissionDataManager.getInstance();
    const data = await manager.loadData();
    updateRows(data);
    console.log('Auto-load completed successfully');
  } catch (error) {
    console.error('Auto-load failed:', error);
  }
})();