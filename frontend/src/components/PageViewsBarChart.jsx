import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

export default function PageViewsBarChart({ yearRange = [2013, 2023], countryCode = 'WLD' }) {
  const theme = useTheme();
  const [data, setData] = React.useState({ years: [], no2: [], ch4: [], n2o: [], other: [] });

  const getVal = (obj, year) => obj?.raw_values?.[year]?.[0] ?? 0;

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/statistics?country_code=${countryCode}&start_year=${yearRange[0]}&end_year=${yearRange[1]}`
      );
      if (!res.ok) throw new Error('Failed fetch');
      const json = await res.json();

      const yrs = [];
      const no2 = [];
      const ch4 = [];
      const n2o = [];
      const other = [];
      for (let y = yearRange[0]; y <= yearRange[1]; y++) {
        const ys = y.toString();
        yrs.push(ys);
        const total = getVal(json.total, ys);
        const co2Val = getVal(json.co2, ys); // mapped to NO2 label
        const ch4Val = getVal(json.ch4, ys);
        const n2oVal = getVal(json.n2o, ys);
        const otherVal = Math.max(total - co2Val - ch4Val - n2oVal, 0);
        const pct = (v) => (total > 0 ? +(100 * v / total).toFixed(2) : 0);
        no2.push(pct(co2Val));
        ch4.push(pct(ch4Val));
        n2o.push(pct(n2oVal));
        other.push(pct(otherVal));
      }
      setData({ years: yrs, no2, ch4, n2o, other });
    } catch (e) {
      console.error(e);
    }
  }, [yearRange, countryCode]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const series = [
    { label: 'NO2', data: data.no2, stack: 'total'},
    { label: 'CH4', data: data.ch4, stack: 'total'},
    { label: 'N2O', data: data.n2o, stack: 'total'},
    { label: 'Other', data: data.other, stack: 'total', color: theme.palette.grey[400]}
  ];
  const availableStackOrder = [
    'none',
    'reverse',
    'appearance',
    'ascending',
    'descending',
  ];
  const [stackOrder, setStackOrder] = React.useState('none');
  const modifiedSeries = [{ ...series[0], stackOrder }, ...series.slice(1)];
  const formattedSeries = modifiedSeries.map((s) => ({ ...s, valueFormatter: (value) => `${value.toFixed(2)}%` }));
  return (
<Box sx={{ width: '100%' }}>
      <TextField
        sx={{ minWidth: 150, mr: 5, mt: 1 }}
        select
        value={stackOrder}
        onChange={(event) => setStackOrder(event.target.value)}
      >
        {availableStackOrder.map((offset) => (
          <MenuItem key={offset} value={offset}>
            {offset}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ py: 2 }}>
        <BarChart
          height={300}
          xAxis={[
            {
              scaleType: 'band',
              data: data.years,
              tickLabelStyle: {
                angle: 90,
                dominantBaseline: 'hanging',
                textAnchor: 'start',
              },
              height: 65,
            },
          ]}
          yAxis={[{ min: 0, max: 100 }]}
          series={formattedSeries}
        />
      </Box>
    </Box>
  );
}
