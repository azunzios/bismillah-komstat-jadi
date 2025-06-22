// StatCard.tsx
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

export interface StatCardProps {
  title: string;
  value: string | number;
  interval: string;
  trend: 'up' | 'down' | 'neutral';
  data: number[];
  details: any;
  growth?: number;
  country?: string;
  loading?: boolean;
}

// Komponen helper gradien area
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

  const trendColors = {
    up: theme.palette.error.main,  // Merah untuk kenaikan
    down: theme.palette.success.main,  // Hijau untuk penurunan
    neutral: theme.palette.grey[500],
  };

  const trendIcons = {
    up: '▲',
    down: '▼',
    neutral: '■',
  };

  const trendLabel = (growth !== undefined && !isNaN(growth))
    ? `${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`
    : trend === 'up'
      ? '+25%'
      : trend === 'down'
        ? '-25%'
        : '+5%';

  const chartColor = trendColors[trend];
  const trendIcon = trendIcons[trend];

  // Helper untuk stat line
  const statLine = (label: string, value: number | undefined, digits = 2) =>
    value !== undefined && !isNaN(value) ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 90 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value.toLocaleString('id-ID', { maximumFractionDigits: digits })}
        </Typography>
      </Stack>
    ) : null;

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
            <Box sx={{ width: '60%', height: 20, bgcolor: '#e0e0e0', borderRadius: 1, mb: 1 }} />
            <Box sx={{ width: '80%', height: 16, bgcolor: '#e0e0e0', borderRadius: 1, mb: 1 }} />
            <Box sx={{ width: '100%', height: 40, bgcolor: '#e0e0e0', borderRadius: 1, mt: 2 }} />
            <Box sx={{ width: '100%', height: 30, bgcolor: '#e0e0e0', borderRadius: 1, mt: 2 }} />
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: `${chartColor}20`,
                  color: chartColor,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {trendIcon} {trendLabel}
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {interval}
            </Typography>

            {/* Statistik */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Statistik Deskriptif
              </Typography>
              <Stack spacing={0.5}>
                {statLine('Rata-rata', details.mean)}
                {statLine('Median', details.median)}
                {statLine('Maksimum', details.max)}
                {statLine('Minimum', details.min)}
                {statLine('Range', details.range)}
                {statLine('Std Deviasi', details.std_dev)}
                {statLine('Variansi', details.variance)}
                {statLine('Jumlah NA', details.na_count, 0)}
              </Stack>
            </Box>

            {/* Grafik */}
            <Box sx={{ width: '100%', height: 50, mt: 1 }}>
              <SparkLineChart
                color={chartColor}
                data={data}
                area
                showHighlight
                showTooltip
                height={50}
                sx={{
                  [`& .${areaElementClasses.root}`]: {
                    fill: `${chartColor}40`,
                  },
                }}
              >
                <AreaGradient color={chartColor} id={`area-gradient-${title}`} />
              </SparkLineChart>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
