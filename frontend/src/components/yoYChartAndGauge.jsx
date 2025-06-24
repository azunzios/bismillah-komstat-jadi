import React, { useEffect, useState, useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  CircularProgress,
  Skeleton,
  TextField,
  Autocomplete,
  Grid,
} from '@mui/material';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';




const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const yearMarks = [
  { value: 1970, label: '1970' },
  { value: 1980, label: '1980' },
  { value: 1990, label: '1990' },
  { value: 2000, label: '2000' },
  { value: 2010, label: '2010' },
  { value: 2020, label: '2020' },
];

const gasOptions = [
  { value: 'total', label: 'Total' },
  { value: 'co2', label: 'CO₂' },
  { value: 'n2o', label: 'N₂O' },
  { value: 'ch4', label: 'CH₄' },
];
const settings = {
  width: 150,
  height: 150,

};

export default function YoYGrowthTrend() {
  const CURRENT_YEAR = new Date().getFullYear();
  const [countries, setCountries] = useState([]);
  const [countryCode, setCountryCode] = useState('WLD');
  const [gasType, setGasType] = useState('total');
  const [startYear, setStartYear] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState([{ data: [] }]);
  const [contrib, setContrib] = useState({ total: 0, co2: 0, n2o: 0, ch4: 0 });
  const [xData, setXData] = useState([]);

  // Fetch country list once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/countries`);
        const json = await res.json();
        setCountries(json.countries || []);
      } catch (e) {
        console.error('Failed to fetch countries', e);
      }
    })();
  }, []);

  // Fetch stats when filters change
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/statistics?country_code=${countryCode}&start_year=${startYear - 1}&end_year=${CURRENT_YEAR}`
        );
        const json = await res.json();
        if (json && json[gasType] && json[gasType].raw_values) {
          const raw = json[gasType].raw_values;
          const years = Object.keys(raw)
            .map((y) => Number(y))
            .sort((a, b) => a - b)
            .filter((y) => y >= startYear - 1);
          const growthArr = [];
          const barYears = [];
          for (let i = 1; i < years.length; i += 1) {
            const prev = Number(raw[years[i - 1]]);
            const curr = Number(raw[years[i]]);
            if (isFinite(prev) && prev !== 0 && isFinite(curr)) {
              const growth = ((curr - prev) / Math.abs(prev)) * 100;
              growthArr.push(Number(growth.toFixed(2)));
              barYears.push(years[i]);
            }
          }
          setSeries([{ data: growthArr }]);
          setXData(barYears.map((y) => new Date(y, 1, 1)));
        }
      } catch (e) {
        console.error('Failed to fetch statistics', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [countryCode, gasType, startYear]);

  // Calculate contribution to world emissions per gas using map-data for accurate world total
  useEffect(() => {
    (async () => {
      try {
        // 1. Fetch country & world data untuktahun startYear
        const [countryRes, worldRes] = await Promise.all([
          fetch(`${API_BASE}/statistics?country_code=${countryCode}&year=${startYear}`),
          fetch(`${API_BASE}/statistics?country_code=WLD&year=${startYear}`),
        ]);
        const countryJson = await countryRes.json();
        const worldJson = await worldRes.json();

        // 2. Hitung kontribusi setiap gas
        const newContrib = {};
        const yearKey = String(startYear);

        for (const k of ['total', 'co2', 'n2o', 'ch4']) {
          // nilai country & world
          const cRaw = countryJson[k]?.raw_values?.[yearKey]?.[0] ?? 0;
          const wRaw = worldJson[k]?.raw_values?.[yearKey]?.[0] ?? 0;
          const cVal = Number(cRaw);
          const wVal = Number(wRaw);

          // persen kontribusi (hindari div/0)
          newContrib[k] = wVal > 0
            ? Math.round((cVal / wVal) * 100)
            : 0;
        }

        // 3. Simpan hasil sekali saja
        setContrib(newContrib);
      } catch (e) {
        console.error('Failed to compute contribution', e);
      }
    })();
  }, [countryCode, startYear]);

  const chartYAxis = useMemo(() => {
    const values = series[0]?.data || [];
    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, -10);
    return [
      {
        colorMap: {
          type: 'piecewise',
          thresholds: [0],
          colors: ['green', 'red'],
        },
        min: minVal,
        max: maxVal,
      },
    ];
  }, [series]);

  return (

    <Grid container spacing={2} columns={2}>
      <Grid item xs={12} md={6} size={1}>
        <Card variant="outlined" sx={{overflow: 'visible'}}>
          <CardContent sx={{overflow: 'visible'}}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' , justifyContent: 'space-between', gap: '10px'}}>
                <Autocomplete
                  fullWidth
                  sx={{ width: 200 }}
                  options={countries}
                  getOptionLabel={(option) => option.name || ''}
                  value={countries.find((c) => c.code === countryCode) || null}
                  onChange={(e, newVal) => setCountryCode(newVal ? newVal.code : '')}
                  renderInput={(params) => <TextField {...params} label="Area" size="small" variant="standard" />}
                  slotProps={{
                            clearIndicator: {
                              sx: {
                                p: 0,
                                width: 24,
                                height: 24,
                                marginRight: 0.5,
                                border: 'none',
                                '& svg': { fontSize: 16 }
                              }
                            },
                            popupIndicator: {
                              sx: {
                                p: 0,
                                width: 24,
                                height: 24,
                                '& svg': { fontSize: 16 },
                                border: 'none'
                              }
                            }
                          }}
                        />
                <Autocomplete
                  options={gasOptions}
                  sx={{ width: 200 }}
                  getOptionLabel={(option) => option.label}
                  value={gasOptions.find((g) => g.value === gasType) || null}
                  onChange={(e, newValue) => setGasType(newValue ? newValue.value : '')}
                  renderInput={(params) => <TextField {...params} label="Gas Type" variant="standard" size="small"/>}
                  slotProps={{
                    clearIndicator: {
                      sx: {
                        p: 0,
                        width: 24,
                        height: 24,
                        marginRight: 0.5,
                        border: 'none',
                        '& svg': { fontSize: 16 }
                      }
                    },
                    popupIndicator: {
                      sx: {
                        p: 0,
                        width: 24,
                        height: 24,
                        '& svg': { fontSize: 16 },
                        border: 'none'
                      }
                    }
                  }}
                />
                              {/* Slider container */}
              <Box sx={{ width: '100%' }}>
                <Slider
                  value={startYear}
                  min={1960}
                  max={CURRENT_YEAR - 1}
                  step={1}
                  valueLabelDisplay="auto"
                  marks={yearMarks}
                  onChange={(e, val) => setStartYear(val)}
                  size="small"
                />
              </Box>
            </div>

            <Typography component="h2" variant="subtitle2" gutterBottom sx={{mt: 1}}>
              GHG Emissions YoY Growth (%)
            </Typography>

            {loading ? (
              <Box width="100%" py={2}>
                <Stack spacing={2} alignItems="center">
                  <Skeleton variant="rectangular" width="100%" height={40} animation="wave" />
                  <Skeleton variant="rectangular" width="100%" height={300} animation="wave" />
                </Stack>
              </Box>
            ) : (
              <BarChart
                height={300}
                grid={{ horizontal: true }}
                series={series}
                yAxis={chartYAxis}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: xData,
                    valueFormatter: (value) => value.getFullYear().toString(),
                    height: 65,
                    tickLabelStyle: {
                      angle: 90,
                      dominantBaseline: 'hanging',
                      textAnchor: 'start',
                    },
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6} size={1} overflow="hidden">
        <Card sx={{ p: 2 }}>
          <Grid container rowSpacing={2} justifyContent="space-between" marginX={2} overflow="hidden" wrap="nowrap">
            {gasOptions.map((g) => (
              <Grid key={g.value} item xs={6} sx={{ p: 1 }} display="flex" justifyContent="center" alignItems="center" flexWrap="wrap" flexDirection="column">
                <Typography variant="body2" gutterBottom align="center" sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'wrap' }}>
                  {`Kontribusi ${countries.find(c => c.code === countryCode)?.name || ''} 
                  terhadap emisi gas ${g.label} dunia (%)`}
                </Typography>
                <Gauge
                  value={contrib[g.value] || 0}
                  {...settings}
                  cornerRadius="50%"
                  sx={(theme) => ({
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 40,
                    },
                    [`& .${gaugeClasses.valueArc}`]: {
                      fill: '#52b202',
                    },
                    [`& .${gaugeClasses.referenceArc}`]: {
                      fill: theme.palette.text.disabled,
                    },
                  })}
                />
              </Grid>
            ))}
          </Grid>
        </Card>

      </Grid>
    </Grid>
  );
}
