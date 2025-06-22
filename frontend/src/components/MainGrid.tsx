import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Copyright from '../internals/components/Copyright';
import ChartUserByCountry from './ChartUserByCountry';
import CustomizedTreeView from './CustomizedTreeView';
import CustomizedDataGrid from './CustomizedDataGrid';
import HighlightedCard from './HighlightedCard';
import PageViewsBarChart from './PageViewsBarChart';
import SessionsChart from './SessionsChart';
import StatCard, { StatCardProps } from './StatCard';
import CountryYearFilter from './CountryYearFilter';

// --- Dynamic Dashboard State and Fetch Logic ---
import { useEffect, useState } from 'react';

const DEFAULT_COUNTRY = 'World';
const DEFAULT_YEAR_RANGE = [2013, 2023];

const GAS_KEYS = [
  { key: 'total', title: 'Total GHG (MtCO2)' },
  { key: 'co2', title: 'Gas CO2 (MtCO2)' },
  { key: 'n2o', title: 'Gas N2O (MtCO2)' },
  { key: 'ch4', title: 'Gas CH4 (MtCO2)' },
];

export default function MainGrid() {
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY);
  const [yearRange, setYearRange] = useState<number[]>(DEFAULT_YEAR_RANGE);
  const [stats, setStats] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats and growth when country or year range changes
  useEffect(() => {
    if (!country || yearRange.length !== 2) return;
    setLoading(true);
    setError(null);
    const codeFetch = async () => {
      try {
        // Fetch country code from backend country list
        const res = await fetch('http://127.0.0.1:8000/countries');
        const data = await res.json();
        const countryObj = data.countries.find((c: any) => c.name === country);
        const code = countryObj ? countryObj.code : 'WLD';

        // Fetch statistics
        const statsRes = await fetch(`http://127.0.0.1:8000/statistics?country_code=${code}&start_year=${yearRange[0]}&end_year=${yearRange[1]}`);
        const statsData = await statsRes.json();
        // Fetch growth
        const growthRes = await fetch(`http://127.0.0.1:8000/growth?country_code=${code}&start_year=${yearRange[0]}&end_year=${yearRange[1]}`);
        const growthData = await growthRes.json();
        setStats(statsData);
        setGrowth(growthData);
      } catch (e: any) {
        setError('Gagal memuat data statistik.');
      } finally {
        setLoading(false);
      }
    };
    codeFetch();
  }, [country, yearRange]);

  // Prepare StatCard data
  const statCards = GAS_KEYS.map(({ key, title }) => {
    const stat = stats?.[key] || {};
    let growthVal = growth?.[key];
    // Jika growthVal array, ambil index 0
    if (Array.isArray(growthVal)) {
      growthVal = growthVal.length > 0 ? growthVal[0] : undefined;
    }
    // Compose value string (mean, median, etc. in Indonesian)
    const value = stat.mean !== undefined && stat.mean !== null ? stat.mean.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-';
    // Compose interval string
    const interval = `${yearRange[0]} - ${yearRange[1]}`;
    // Determine trend
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (growthVal !== undefined && growthVal !== null) {
      if (growthVal > 0) trend = 'up';
      else if (growthVal < 0) trend = 'down';
    }
    // Prepare data array for chart (use all year values in range)
    let dataArr: number[] = [];
    if (stats && stats[key]) {
      // For chart, fetch raw values for each year in range
      const years = Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => (yearRange[0] + i).toString());
      dataArr = years.map(yr => {
        // Use stats[key].raw_values[yr] if backend provides, otherwise fallback to mean
        if (stats[key].raw_values && stats[key].raw_values[yr] !== undefined && stats[key].raw_values[yr] !== null) {
          return stats[key].raw_values[yr];
        }
        return stat.mean;
      }).filter(v => v !== null) as number[];
      if (dataArr.length === 0 && stat.mean) dataArr = [stat.mean];
    }
    return {
      title,
      value,
      interval,
      trend,
      data: dataArr,
      details: stat,
      growth: growthVal,
      country: country,
    };
  });

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Overview
      </Typography>
      <CountryYearFilter
        onCountryChange={val => val && setCountry(val)}
        onYearChange={range => setYearRange(range)}
      />
      <Grid
        container
        spacing={2}
        columns={15}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        {loading ? (
          GAS_KEYS.map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title={''}
                value={''}
                interval={''}
                trend={'neutral'}
                data={[]}
                details={{}}
                growth={undefined}
                country={''}
                loading={true}
              />
            </Grid>
          ))
        ) : error ? (
          <Grid size={{ xs: 12 }}>
            <Typography color="error">{error}</Typography>
          </Grid>
        ) : (
          statCards.map((card, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard {...card} />
            </Grid>
          ))
        )}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <HighlightedCard />
        </Grid>
        <Grid size={{ xs: 12, md: 7.5 }}>
          <SessionsChart />
        </Grid>
        <Grid size={{ xs: 12, md: 7.5 }}>
          <PageViewsBarChart />
        </Grid>
      </Grid>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Details
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <CustomizedDataGrid />
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
            <CustomizedTreeView />
            <ChartUserByCountry />
          </Stack>
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
