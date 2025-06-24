import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';
import { useCallback, useEffect, useState } from 'react';

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  );
}

function getYearsRange(startYear: number, endYear: number) {
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year.toString());
  }
  return years;
}

interface GasData {
  id: string;
  label: string;
  color: string;
  data: number[];
}

interface ApiResponse {
  [key: string]: {
    raw_values: {
      [year: string]: number[];
    };
  };
}

interface GHGEmissionsChartProps {
  yearRange: [number, number];
}

export default function GHGEmissionsChart({ yearRange }: GHGEmissionsChartProps) {
  const theme = useTheme();
  const [gasData, setGasData] = useState<GasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Mengambil data dari API yang sama dengan MainGrid
      const response = await fetch(`http://127.0.0.1:8000/statistics?country_code=WLD&start_year=${yearRange[0]}&end_year=${yearRange[1]}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data dari API');
      }
      const data: ApiResponse = await response.json();
      
      // Generate years based on yearRange
      const yearsArr = getYearsRange(yearRange[0], yearRange[1]);
      setYears(yearsArr);
      
      // Process data for each gas type
      const processedData: GasData[] = [
        {
          id: 'total',
          label: 'Total GHG',
          color: theme.palette.primary.dark,
          data: processGasData(data.total?.raw_values, yearsArr)
        },
        {
          id: 'co2',
          label: 'CO2',
          color: theme.palette.error.main,
          data: processGasData(data.co2?.raw_values, yearsArr)
        },
        {
          id: 'n2o',
          label: 'N2O',
          color: theme.palette.warning.main,
          data: processGasData(data.n2o?.raw_values, yearsArr)
        },
        {
          id: 'ch4',
          label: 'CH4',
          color: theme.palette.success.main,
          data: processGasData(data.ch4?.raw_values, yearsArr)
        }
      ];
      
      setGasData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data emisi. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  }, [theme, yearRange]);

  // Helper function to process gas data
  const processGasData = (rawValues: {[year: string]: number[]} = {}, years: string[]): number[] => {
    return years.map(year => {
      const value = rawValues[year]?.[0];
      return value !== undefined ? value : 0;
    });
  };

  // Fetch data when component mounts or when yearRange changes
  useEffect(() => {
    fetchData();
  }, [fetchData, yearRange]);

  const colorPalette = gasData.map(gas => gas.color);

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography component="h2" variant="subtitle2">
              GHG Emissions Trend
            </Typography>
            {years.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Menampilkan data tahun {years[0]}-{years[years.length - 1]}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {gasData.map((gas) => (
              <Box key={gas.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: gas.color, borderRadius: '2px' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {gas.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <LineChart
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'point',
              data: years,
              tickInterval: (index, i) => i % 2 === 0, // Show every other year
              height: 24,
            },
          ]}
          yAxis={[{ width: 60 }]}
          series={gasData.map((gas) => ({
            id: gas.id,
            label: gas.label,
            showMark: false,
            curve: 'linear',
            area: true,
            stackOrder: 'ascending',
            data: gas.data,
          }))}
          height={250}
          margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiAreaElement-series-total': {
              fill: "url('#total')",
            },
            '& .MuiAreaElement-series-co2': {
              fill: "url('#co2')",
            },
            '& .MuiAreaElement-series-n2o': {
              fill: "url('#n2o')",
            },
            '& .MuiAreaElement-series-ch4': {
              fill: "url('#ch4')",
            },
          }}
          hideLegend
        >
          {gasData.map((gas) => (
            <AreaGradient key={gas.id} color={gas.color} id={gas.id} />
          ))}
        </LineChart>
      </CardContent>
    </Card>
  );
}
