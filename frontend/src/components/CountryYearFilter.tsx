import * as React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Slider,
  Paper,
  Grid
} from '@mui/material';
import { useCountries } from './useCountries';

const minYear = 1970;
const maxYear = 2025;

interface CountryYearFilterProps {
  onCountryChange?: (value: string | null) => void;
  onYearChange?: (range: number[]) => void;
  yearRange?: number[]; // Tambahkan prop yearRange
}

export default function CountryYearFilter({
  onCountryChange = () => {},
  onYearChange = () => {},
  yearRange: yearRangeProp // Ambil prop yearRange dari parent
}: CountryYearFilterProps) {
  const [country, setCountry] = React.useState<string | null>('');
  // Gunakan yearRange dari prop jika ada, jika tidak pakai default
  const [yearRange, setYearRange] = React.useState<number[]>(yearRangeProp || [2013, 2023]);
  // Sinkronkan state dengan prop jika berubah dari parent
  React.useEffect(() => {
    if (
      yearRangeProp &&
      (yearRangeProp[0] !== yearRange[0] || yearRangeProp[1] !== yearRange[1])
    ) {
      setYearRange(yearRangeProp);
    }
    // eslint-disable-next-line
  }, [yearRangeProp]);
  const [focused, setFocused] = React.useState(false);
  const { countries, loading, error } = useCountries();

  const handleCountryChange = (_event: React.SyntheticEvent, value: string | null) => {
    setCountry(value);
    onCountryChange(value);
  };

  const handleYearChange = (_event: Event, newValue: number | number[]) => {
    const range = Array.isArray(newValue) ? newValue : [minYear, maxYear];
    setYearRange(range);
    onYearChange(range);
  };

  return (
    <Grid container spacing={2} columns={15} alignItems="center" sx={{ mt: 2 }}>
      <Grid size={{ xs: 15, sm: 3 }}>
        <Autocomplete
          options={countries.map((c: { name: string }) => c.name)}
          value={country}
          onChange={handleCountryChange}
          loading={loading}
          renderInput={(params) => {
            const showLabel = !focused && !country;
            return (
              <TextField
                {...params}
                label={showLabel ? 'Pilih Negara' : ''}
                variant="standard"
                size="small"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                helperText={error ? 'Gagal memuat negara' : undefined}
                sx={{
                  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                    fontSize: 16,
                    minWidth: 24,
                    p: 0,
                  },
                  fontSize: 14
                }
              }
              />
            );
          }}
          size="small"
          sx={{
            minWidth: 120,
            maxWidth: '100%',
            '& .MuiInputBase-root': {
              minHeight: 32,
              fontSize: 14
            }
          }}
          autoHighlight
          clearOnEscape
          slotProps={{
            clearIndicator: {
              sx: {
                p: 0,
                width: 24,
                height: 24,
                marginRight: 0.5,
                '& svg': { fontSize: 16 },
                border: 'none'
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
      </Grid>

      {/* Spacer tengah: 9 kolom (bisa diisi filter tambahan) */}
      <Grid size={{ xs: 15, sm: 9 }} />

      {/* Kolom 3 akhir: Slider tahun */}
      <Grid size={{ xs: 15, sm: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Paper
            variant="outlined"
            sx={{
              px: 1,
              borderRadius: 2,
              fontSize: 14,
              minWidth: 100,
              textAlign: 'center',
              backgroundColor: 'background.paper'
            }}
          >
            {yearRange[0]} - {yearRange[1]}
          </Paper>
          <Slider
            value={yearRange}
            onChange={handleYearChange}
            valueLabelDisplay="auto"
            marks
            min={minYear}
            max={maxYear}
            step={1}
            sx={{ width: '100%' }}
            size="small"
          />
        </Box>
      </Grid>
    </Grid>
  );
}
