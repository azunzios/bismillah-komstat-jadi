import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { areaElementClasses } from '@mui/x-charts/LineChart';

export interface DataPoint {
  year: number;
  value: number;
}

// Updated interface to handle growth object structure
export interface GrowthObject {
  value: number[];
  unit: string[];
  error: Record<string, any>;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  interval: string;
  trend: 'up' | 'down' | 'neutral';
  data: DataPoint[];
  details: any;
  growth?: number | GrowthObject; // Updated to handle both number and object
  country?: string;
  loading?: boolean;
}

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  interval,
  trend = 'neutral',
  data = [],
  details = {},
  growth,
  country,
  loading = false
}) => {
  const theme = useTheme();

  // Helper function to extract growth value
  const getGrowthValue = (growth: number | GrowthObject | undefined): number | undefined => {
    if (growth === undefined) return undefined;

    if (typeof growth === 'number') {
      return growth;
    }

    // Handle growth object structure
    if (growth && typeof growth === 'object' && 'value' in growth) {
      const growthObj = growth as GrowthObject;
      return growthObj.value && growthObj.value.length > 0 ? growthObj.value[0] : undefined;
    }

    return undefined;
  };

  const growthValue = getGrowthValue(growth);

  const derivedTrend: 'up' | 'down' | 'neutral' =
    growthValue !== undefined && !isNaN(growthValue)
      ? growthValue > 0
        ? 'up'
        : growthValue < 0
          ? 'down'
          : 'neutral'
      : trend;

  const trendColors = {
    up: theme.palette.error.main,
    down: theme.palette.success.main,
    neutral: theme.palette.grey[500],
  } as const;

  const trendIcons = {
    up: '▲',
    down: '▼',
    neutral: '■',
  } as const;

  const trendLabel = (growthValue !== undefined && !isNaN(growthValue))
    ? `${growthValue > 0 ? '+' : ''}${growthValue.toFixed(2)}%`
    : derivedTrend === 'up'
      ? '+25%'
      : derivedTrend === 'down'
        ? '-25%'
        : '+5%';

  const chartColor = trendColors[derivedTrend];
  const trendIcon = trendIcons[derivedTrend];

  const statLine = (label: string, value: number | undefined, digits = 2) =>
    value !== undefined && !isNaN(value) ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 90 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value.toLocaleString('id-ID', { maximumFractionDigits: digits })}
        </Typography>
      </Stack>
    ) : null;

  const { chartData, years } = React.useMemo(() => {
    const values: number[] = [];
    const yearLabels: string[] = [];

    data.forEach(item => {
      if (item?.value !== undefined && item.year !== undefined) {
        values.push(Number(item.value));
        yearLabels.push(String(item.year));
      }
    });

    return { chartData: values, years: yearLabels };
  }, [data]);

  const formatTooltip = (value: number, index: number) => {
    const year = years[index] || '';
    return `${year}: ${value.toFixed(2)}`;
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        {country && !loading && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {country}
          </Typography>
        )}
        {loading ? (
          <Box>
            {/* skeleton loaders... */}
          </Box>
        ) : (
          <Box>
            <Typography component="h2" variant="subtitle2" gutterBottom>
              {title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography variant="h5" component="div">
                {value}
              </Typography>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex', alignItems: 'center',
                  bgcolor: `${chartColor}20`, color: chartColor,
                  px: 1, py: 0.5, borderRadius: 1,
                  fontSize: '0.75rem', fontWeight: 600,
                }}
              >
                {trendIcon} {trendLabel}
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {interval}
            </Typography>

            {/* Statistik Deskriptif */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Statistik Deskriptif
              </Typography>
              <Stack spacing={0.5}>
                {statLine('Rata-rata', details.mean ?? details.mean_value)}
                {statLine('Median', details.median ?? details.median_value)}
                {statLine('Maksimum', details.max ?? details.max_value)}
                {statLine('Minimum', details.min ?? details.min_value)}
                {statLine('Range', details.range ?? (details.max - details.min))}
                {statLine('Std Deviasi', details.std_dev
                  ?? details.standard_deviation
                  ?? details.std_deviation)}
                {statLine('Variansi', details.variance ?? details.var_value)}
                {statLine('Jumlah NA', details.na_count
                  ?? details.na_value
                  ?? details.missing_count
                  ?? 0, 0)}
              </Stack>
            </Box>

            {/* Grafik */}
            <Box sx={{ width: '100%', height: 50, mt: 1, mx: 0 }}>
              <SparkLineChart
                color={chartColor}
                data={chartData}
                area
                showHighlight
                showTooltip
                height={50}
                xAxis={{
                  scaleType: 'band',
                  data: years,
                }}
                sx={{
                  [`& .${areaElementClasses.root}`]: {
                    fill: `url(#area-gradient-${value})`,
                  },
                }}
              >
                <AreaGradient color={chartColor} id={`area-gradient-${value}`} />
              </SparkLineChart>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;