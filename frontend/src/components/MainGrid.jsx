import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Copyright from '../internals/components/Copyright';
import CustomizedDataGrid from './CustomizedDataGrid';
import HighlightedCard from './HighlightedCard';
import PageViewsBarChart from './PageViewsBarChart';
import SessionsChart from './SessionsChart';
import StatCard from './StatCard';
import CountryYearFilter from './CountryYearFilter';
import YoYGrowthTrend from './yoYChartAndGauge';
import Divider from '@mui/material/Divider';
import MapChart from './MapScatterHeatChartandOther.jsx';
import ReactCountryFlag from 'react-country-flag';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { display } from '@mui/system';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { deepOrange, deepPurple, purple } from '@mui/material/colors';




// --- Dynamic Dashboard State and Fetch Logic ---
import { useEffect, useState } from 'react';

const DEFAULT_COUNTRY = 'World';
const DEFAULT_YEAR_RANGE = [2013, 2023];

const GAS_KEYS = [
  { key: 'total', title: 'Total Emisi GHG (MtCO2)' },
  { key: 'co2', title: 'Emisi Gas CO2 (MtCO2)' },
  { key: 'n2o', title: 'Emisi Gas N2O (MtCO2)' },
  { key: 'ch4', title: 'Emisi Gas CH4 (MtCO2)' },
];

import { useRef } from 'react';

export default function MainGrid() {
  const [highlighted, setHighlighted] = React.useState(null);
  const timeoutRef = useRef();
  const [showScroll, setShowScroll] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Scroll with offset and highlight title
  const handleTOCClick = (e, sectionId) => {
    e.preventDefault();
    const yOffset = -90; // adjust as needed for your AppBar height
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setHighlighted(sectionId);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setHighlighted(null), 1500);
    }
  }
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [yearRange, setYearRange] = useState(DEFAULT_YEAR_RANGE);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countryCode, setCountryCode] = useState('WLD');

  // State for form data and options
  const [countries, setCountries] = useState([]);
  const [years] = useState(Array.from({ length: 56 }, (_, i) => 1970 + i).reverse()); // 1970-2025 in descending order
  const [gasTypes] = useState([
    { code: 'total', label: 'Total' },
    { code: 'co2', label: 'CO2' },
    { code: 'ch4', label: 'CH4' },
    { code: 'n2o', label: 'N2O' }
  ]);

  // Form state
  const [formData, setFormData] = useState({
    country: 'WLD',
    gasType: 'total',
    year: new Date().getFullYear(), // Default to previous year
    value: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/countries');
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Form submitted:', formData);

    // Update the stats state with the new form data
    setStats(prevStats => {
      if (!prevStats) return prevStats;

      const updatedStats = { ...prevStats };
      const yearStr = formData.year.toString();

      // Update the specific gas type data if it exists
      if (updatedStats[formData.gasType]) {
        const oldRawValues = {
          ...(updatedStats[formData.gasType].raw_values || {}),
          [yearStr]: [parseFloat(formData.value)]
        };

        const newStats = calculateStats(oldRawValues);

        updatedStats[formData.gasType] = {
          ...updatedStats[formData.gasType],
          raw_values: oldRawValues,
          ...newStats
        };
      }


      // Update the total if this is not a total entry
      if (formData.gasType !== 'total' && updatedStats.total) {
        let newTotal = parseFloat(formData.value);

        // Sum up all other gas types for this year
        ['co2', 'ch4', 'n2o'].forEach(gas => {
          if (gas !== formData.gasType && updatedStats[gas]?.raw_values?.[yearStr]?.[0]) {
            newTotal += parseFloat(updatedStats[gas].raw_values[yearStr][0]);
          }
        });

        // Update the total
        updatedStats.total = {
          ...updatedStats.total,
          raw_values: {
            ...(updatedStats.total.raw_values || {}),
            [yearStr]: [newTotal]
          },
          mean: newTotal
        };
      }

      return updatedStats;
    });

    // Reset form after submission
    setFormData({
      country: 'WLD',
      gasType: 'total',
      year: new Date().getFullYear() - 1,
      value: ''
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  function calculateStats(values) {
    const nums = Object.values(values)
      .flat()
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    if (nums.length === 0) return {};

    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;
    const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nums.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      min,
      max,
      range,
      variance,
      std_dev: stdDev
    };
  }

  // Calculate growth percentage between two years using local stats
  function calculateGrowth(rawValues, yearRange) {
    const start = yearRange[0].toString();
    const end = yearRange[1].toString();
    const startVal = parseFloat(rawValues?.[start]?.[0]);
    const endVal = parseFloat(rawValues?.[end]?.[0]);
    if (isNaN(startVal) || isNaN(endVal) || startVal === 0) return null;
    return ((endVal - startVal) / startVal) * 100;
  }

  // Main data fetching effect
  useEffect(() => {
    if (!country || yearRange.length !== 2) return;

    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        // Fetch country code first
        const countriesRes = await fetch('http://127.0.0.1:8000/countries');
        const countriesData = await countriesRes.json();
        const countryObj = countriesData.countries.find(c => c.name === country);
        const code = countryObj ? countryObj.code : 'WLD';

        setCountryCode(code);

        // Fetch statistics only; growth will be calculated locally
        const statsRes = await fetch(`http://127.0.0.1:8000/statistics?country_code=${code}&start_year=${yearRange[0]}&end_year=${yearRange[1]}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        // Log success
        console.log('Data loaded successfully');
      } catch (error) {
        setError('Gagal memuat data statistik.');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [country, yearRange]);

  // Prepare StatCard data
  const statCards = GAS_KEYS.map(({ key, title }) => {
    const stat = stats?.[key] || {};

    const endYearStr = yearRange[1].toString();
    const latestValRaw = stats?.[key]?.raw_values?.[endYearStr]?.[0];
    const latestVal = latestValRaw !== undefined ? parseFloat(latestValRaw) : null;

    console.log(`Stats for ${key}:`, stat);

    // Calculate growth locally based on raw values
    let growthVal = calculateGrowth(stats?.[key]?.raw_values, yearRange);
    console.log(`Growth for ${key}:`, growthVal);

    // Compose value string (mean, median, etc. in Indonesian)
    const value = latestVal !== null && !isNaN(latestVal)
      ? `(${endYearStr}): ${latestVal.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
      : '-';

    // Compose interval string
    const interval = `${yearRange[0]} - ${yearRange[1]}`;

    // Determine trend
    let trend = 'neutral';
    if (growthVal !== undefined && growthVal !== null) {
      if (growthVal > 0) trend = 'up';
      else if (growthVal < 0) trend = 'down';
    }

    // Prepare data array for chart with years and values
    let chartData = [];
    if (stats && stats[key]) {
      const years = Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => yearRange[0] + i);
      chartData = years.map(year => {
        const yearStr = year.toString();
        const value = (stats[key].raw_values && stats[key].raw_values[yearStr] !== undefined && stats[key].raw_values[yearStr] !== null)
          ? stats[key].raw_values[yearStr]
          : stat.mean;
        return {
          year,
          value: value !== null ? Number(value) : 0
        };
      }).filter(item => item.value !== null);

      if (chartData.length === 0 && stat.mean) {
        chartData = [{ year: yearRange[0], value: Number(stat.mean) }];
      }
    }
    return {
      title,
      value,
      interval,
      trend,
      data: chartData,
      details: stat,
      growth: growthVal,
      country: country,
    };
  });

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '100%' }, px: 0, mx: {xs:2, md:10}, mt: 0 }}>
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 600, md: 600 }, minHeight: 180, overflow: 'hidden' }}>
        <img src="/assets/factory.jpg" alt="factory" style={{ width: '100%', height: '100%', objectFit: 'none', display: 'block' }} />
        <Box sx={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: { xs: '100%', sm: '60%' },
          color: '#fff',
          px: {xs: 4, md:20},
          pb: 3,
          zIndex: 2,
        }}>
          <Typography component="div" variant="h2" sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '2.7rem' }, mb: 0.5 }}>
            Dashboard Emisi Global Gas Rumah Kaca
          </Typography>
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: 'rgba(255,255,255,0.85)', fontSize: { xs: '1rem', sm: '1.2rem' } }}
          >
            Merupakan dashboard yang menampilkan deskripsi dan analisis non-parametrik dari data emisi gas rumah kaca global.
          </Typography>
          <Typography component="div" sx={{ textAlign: 'justify' }}>
            Dashboard ini dirancang sebagai alat visualisasi interaktif untuk memahami dan menganalisis tren emisi gas rumah kaca (GRK) secara global dalam rentang waktu yang cukup panjang, yaitu dari tahun <strong>1970 hingga 2023</strong>. Data akan terus diperbarui secara berkala apabila tersedia pembaruan dari sumber resminya. Tujuan utama dashboard ini adalah memberikan informasi yang dapat digunakan untuk pengambilan keputusan, riset kebijakan iklim, hingga edukasi publik tentang pentingnya mitigasi emisi GRK.
          </Typography>
        </Box>
      </Box>
      <Box sx={{ backgroundColor: '#112F4E', color: '#fff', px: {xs: 4, md:20}, pb: 2 }}>
        <Grid container columns={3} spacing={2} sx={{ mb: 2 }}>
          <Grid item size={1}>
            <Box sx={{ my: 2, maxWidth: 400 }}>
              <Typography variant="h4" sx={{ mb: 0 }}>
                Daftar Isi
              </Typography>
              <Box>
                <List component="nav" dense>
                  {/* Gambaran Umum GHGE berdasarkan Tahun dan Area */}
                  <ListItemButton
                    sx={{ pl: 2, '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                    onClick={e => handleTOCClick(e, 'tahun-area-section')}
                  >
                    <ListItemText primary="Gambaran Umum GHGE berdasarkan Tahun dan Area" />
                  </ListItemButton>
                  <List disablePadding sx={{ pl: {xs:1, md:4}, wrap: 'wrap', display: 'flex'}}>
                    <ListItemButton
                      sx={{ '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                      onClick={e => handleTOCClick(e, 'form-section')}
                    >
                      <ListItemText primary="Tambah/ Update Data" />
                    </ListItemButton>
                  </List>
                  {/* Gambaran Umum GHGE berdasarkan Area, Tahun, dan Tipe Gas */}
                  <ListItemButton
                    sx={{ pl: 2, '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                    onClick={e => handleTOCClick(e, 'area-tahun-tipe-section')}
                  >
                    <ListItemText primary="Gambaran Umum GHGE berdasarkan Area, Tahun, dan Tipe Gas" />
                  </ListItemButton>
                  {/* Gambaran Umum GHGE berdasarkan Tahun dan Tipe Gas */}
                  <ListItemButton
                    sx={{ pl: 2, '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                    onClick={e => handleTOCClick(e, 'tahun-tipe-section')}
                  >
                    <ListItemText primary="Gambaran Umum GHGE berdasarkan Tahun dan Tipe Gas" />
                  </ListItemButton>
                  <List disablePadding sx={{ pl: {xs:1, md:4} }}>
                    <ListItemButton
                      sx={{ '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                      onClick={e => handleTOCClick(e, 'peta-section')}
                    >
                      <ListItemText primary="Peta Choropleth Global" />
                    </ListItemButton>
                  </List>
                  {/* Tabel Data Detail */}
                  <ListItemButton
                    sx={{ pl: 2, '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                    onClick={e => handleTOCClick(e, 'tabel-section')}
                  >
                    <ListItemText primary="Tabel Data Detail" />
                  </ListItemButton>
                </List>
              </Box>
            </Box>
          </Grid>
          <Grid item size={2}>
            <Box>
              <Typography variant="h4" sx={{ mb: 2, mt: 2, borderBottom: highlighted === 'tahun-area-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}>
                Informasi Data & Petunjuk Penggunaan
              </Typography>
              <Box component="div" sx={{ whiteSpace: 'wrap', overflow: 'auto', height: '400px', color: '#fff', backgroundColor: '#151516', borderRadius: 1, p: 2 }}>
                <h3>📊 Informasi Data</h3>
                <p>
                  Sumber utama dari data dalam dashboard ini berasal dari <strong>Bank Dunia</strong> dan dapat diakses melalui situs resminya di{' '}
                  <Box
                    component="a"
                    href="https://data360.worldbank.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#fff',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    https://data360.worldbank.org/
                  </Box>
                  . Data yang ditampilkan mencakup estimasi tahunan emisi gas rumah kaca dari berbagai negara dan wilayah dunia, serta total global.
                </p>
                <Box>
                  <p>
                    Dashboard ini memanfaatkan data dari <strong>EDGAR (Emissions Database for Global Atmospheric Research)</strong> melalui Community GHG Database, sebuah kolaborasi antara <em>European Commission</em> dan <em>Joint Research Centre (JRC)</em>, serta <em>International Energy Agency (IEA)</em>. Basis data ini terdiri dari:
                    <ul>
                      <li>IEA-EDGAR CO<sub>2</sub></li>
                      <li>EDGAR CH<sub>4</sub></li>
                      <li>EDGAR N<sub>2</sub>O</li>
                      <li>EDGAR F-GASES</li>
                      <li>Versi 8.0 (2023), dirilis oleh European Commission dan JRC</li>
                    </ul>
                  </p>

                  <p>
                    Data yang digunakan <strong>tidak mencakup LULUCF</strong> (Land Use, Land-Use Change, and Forestry), yaitu aktivitas yang berkaitan dengan perubahan penggunaan lahan seperti deforestasi atau reforestasi yang dapat memengaruhi stok karbon di alam. Dengan mengecualikan LULUCF, maka yang dianalisis adalah emisi dari sektor energi, industri, limbah, dan pertanian.
                  </p>

                  <h3>🛠️ Petunjuk Penggunaan</h3>
                  <p>
                    Di dalam dashboard ini, Anda akan menemukan berbagai elemen interaktif seperti <strong>input teks, dropdown, pemilih tahun (slider), pilihan negara dan tipe gas</strong>. Komponen-komponen ini telah dikelompokkan dan dirancang agar mudah diubah sesuai kebutuhan analisis pengguna. Anda dapat dengan bebas memilih kombinasi negara, rentang waktu, dan tipe gas rumah kaca untuk menyesuaikan tampilan informasi yang ingin Anda telusuri.
                  </p>

                  <p>
                    Salah satu fitur menarik dalam dashboard ini adalah formulir yang memungkinkan Anda <strong>melakukan simulasi perubahan data</strong>. Artinya, Anda bisa memasukkan nilai secara manual untuk melihat bagaimana perubahan angka tertentu dapat memengaruhi keseluruhan statistik seperti rata-rata, pertumbuhan tahunan, hingga grafik visualisasi tren. Perlu dicatat bahwa perubahan ini bersifat lokal dan tidak akan mengubah data asli.
                  </p>

                  <p>
                    Di bagian atas atau samping dashboard tersedia navigasi berupa <strong>daftar isi atau tombol loncat section</strong>. Anda dapat menggunakannya untuk langsung menuju bagian yang ingin Anda lihat tanpa harus menggulir manual. Beberapa section penting di dalam dashboard ini adalah:
                  </p>

                  <ul>
                    <li><strong>Gambaran Umum GHGE berdasarkan Tahun dan Area:</strong> Menampilkan tren emisi gas rumah kaca global berdasarkan lokasi geografis dan rentang waktu tertentu, memberikan konteks spasial dan temporal.</li>
                    <li><strong>Gambaran Umum GHGE berdasarkan Area, Tahun, dan Tipe Gas:</strong> Memberikan rincian distribusi emisi untuk setiap tipe gas seperti CO<sub>2</sub>, CH<sub>4</sub>, N<sub>2</sub>O secara per wilayah dan waktu.</li>
                    <li><strong>Gambaran Umum GHGE berdasarkan Tahun dan Tipe Gas:</strong> Menampilkan evolusi masing-masing tipe gas dari tahun ke tahun, berguna untuk mengidentifikasi gas mana yang memiliki tren peningkatan atau penurunan signifikan.</li>
                    <li><strong>Tabel Data Detail:</strong> Disediakan dalam bentuk tabel yang dapat dicari dan difilter. Tabel ini menampilkan data numerik mentah dari hasil pemrosesan dan dapat digunakan untuk referensi analitis lebih lanjut.</li>
                  </ul>

                  <h3>📈 Menu Analisis</h3>
                  <p>
                    Selain dashboard utama, pengguna dapat mengakses halaman khusus <strong>Analisis</strong> yang tersedia melalui menu navigasi (navbar). Di halaman ini, disediakan berbagai jenis analisis deskriptif dan non-parametrik yang membantu memahami lebih dalam pola, anomali, dan korelasi dari data emisi.
                  </p>

                  <p>
                    Analisis yang tersedia mencakup: tren pertumbuhan tahunan, variasi antar negara, dan perbandingan per sektor. Semua metode analisis dilakukan berdasarkan prinsip transparansi data dan tidak dimodifikasi untuk menghasilkan bias atau opini tertentu.
                  </p>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ px: {xs:4, md:20}}}>
        {/* Daftar Isi (Table of Contents) dan informasi data */}
        {/* Gambaran Umum Section Anchor */}
        <div id="gambaran-umum-section">
          <Typography
            id="tahun-area-section"
            component="h2"
            variant="h4"
            sx={{ mb: 2, mt: 1, borderBottom: highlighted === 'tahun-area-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}
          >
            {/* Export to PDF Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Export section and below as PDF
                  import('html2pdf.js').then(html2pdf => {
                    const element = document.getElementById('gambaran-umum-section');
                    if (element) {
                      html2pdf.default().from(element).set({
                        margin: 0.5,
                        filename: 'GHGE_Gambaran_Umum.pdf',
                        html2canvas: { scale: 2 },
                        jsPDF: { orientation: 'portrait', unit: 'in', format: 'a4' }
                      }).save();
                    }
                  });
                }}
                sx={{ mb: 2 }}
              >
                Export PDF
              </Button>
            </Box>
            Gambaran Umum GHGE berdasarkan Tahun dan Area
          </Typography>
        <Divider />
        <Box id="form-section" sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ borderBottom: highlighted === 'form-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}
          >
            Tambah/Update Data
          </Typography>
          <Typography sx={{mb:2}}>
            Lihat perubahan yang akan terjadi jika data diubah atau ditambahkan <br />
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} columns={14}>
              <Grid item size={{xs: 14, md: 3}}>
                <TextField
                  fullWidth
                  id="country"
                  size="small"
                  select
                  name="country"
                  label="Pilih Kode Negara"
                  value={formData.country}
                  onChange={handleInputChange}
                  variant="filled"
                  disabled={isLoading}
                  slotProps={{
                    select: {
                      native: true
                    },
                    inputLabel: {
                      shrink: true,
                    }
                  }}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{xs: 14, md: 3}}>
                <TextField
                  fullWidth
                  id="year"
                  size="small"
                  select
                  name="year"
                  label="Pilih Tahun"
                  value={formData.year}
                  onChange={handleInputChange}
                  variant="filled"
                  disabled={isLoading}
                  slotProps={{
                    select: {
                      native: true,
                    },
                    inputLabel: {
                      shrink: true,
                    }
                  }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{xs: 14, md: 3}}>
                <TextField
                  fullWidth
                  id="gas_type"
                  size="small"
                  select
                  name="gasType"
                  label="Tipe Gas"
                  value={formData.gasType}
                  onChange={handleInputChange}
                  variant="filled"
                  disabled={isLoading}
                  slotProps={{
                    select: {
                      native: true,
                    },
                    inputLabel: {
                      shrink: true,
                    }
                  }}
                >
                  {gasTypes.map((gas) => (
                    <option key={gas.code} value={gas.code}>
                      {gas.label}
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item size={{xs: 14, md: 3}}>
                <TextField
                  variant="filled"
                  size="small"
                  label="Nilai"
                  fullWidth
                  id="value"
                  onChange={(e) => {
                    let val = e.target.value;

                    // Ganti koma ke titik agar selalu desimal dot (.)
                    val = val.replace(',', '.');

                    // Hanya izinkan angka dan titik (hindari spasi atau huruf)
                    if (/^[0-9]*[.]?[0-9]*$/.test(val) || val === '') {
                      setFormData(prev => ({
                        ...prev,
                        value: val
                      }));
                    }
                  }}
                  inputMode="decimal"
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">MtCO2</InputAdornment>
                    ),
                    sx: { textAlign: 'right' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2} size={2}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={isLoading}
                >
                  Tambah
                </Button>
              </Grid>
            </Grid>
          </form>
          <Typography sx={{mt:2, fontStyle: 'italic', color: 'text.secondary'}}>
            *Perubahan hanya terjadi sementara, tidak mengubah data yang asli
          </Typography>
        </Box>
        <Box id="filter-section">
          <CountryYearFilter
            onCountryChange={val => val && setCountry(val)}
            onYearChange={range => setYearRange(range)}
          />
        </Box>
        <Grid
          id="statistik-section"
          container
          spacing={2}
          columns={15}
          sx={{ mb: (theme) => theme.spacing(2) }}
        >
          {loading ? (
            GAS_KEYS.map((_, index) => (
              <Grid key={index} size={{ xs: 15, lg: 3 }}>
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
              <Grid key={index} size={{ xs: 15, lg: 3 }}>
                <StatCard {...card} />
              </Grid>
            ))
          )}
          <Grid size={{ xs: 15, lg: 3 }}>
            <HighlightedCard />
          </Grid>
          <Grid size={{ xs: 15, md: 7.5 }}>
            <SessionsChart yearRange={yearRange} />
          </Grid>
          <Grid size={{ xs: 15, md: 7.5 }}>
            <PageViewsBarChart yearRange={yearRange} countryCode={countryCode} />
          </Grid>
        </Grid>

        <Box id="area-tahun-tipe-section">
          <Typography
            component="h2"
            variant="h4"
            sx={{ mb: 2, borderBottom: highlighted === 'area-tahun-tipe-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}
          >
            Gambaran Umum GHGE berdasarkan Area, Tahun, dan Tipe Gas
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid>
            <YoYGrowthTrend />
          </Grid>
        </Box>
        <Box id="tahun-tipe-section">
          <Typography
            component="h2"
            variant="h4"
            sx={{ mb: 2, mt: 2, borderBottom: highlighted === 'tahun-tipe-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}
          >
            Gambaran Umum GHGE berdasarkan Tahun dan Tipe Gas
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box id="peta-section" sx={{ width: '100%', mt: 4 }}>
            <Typography
              component="h3"
              variant="h6"
              sx={{ mb: 2, borderBottom: highlighted === 'peta-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}
            >
              Peta Choropleth Global
            </Typography>
            <MapChart />
          </Box>
        </Box>
        <Box id="tabel-section">
          <Typography
            component="h2"
            variant="h4"
            sx={{ mb: 2, borderBottom: highlighted === 'tabel-section' ? '3px solid #1976d2' : 'none', transition: 'border-bottom 0.3s' }}
          >
            Tabel Data Detail
          </Typography>
          <Grid container spacing={2} columns={12}>
            <CustomizedDataGrid />
          </Grid>
        </Box>
        <Box id="tentang-kami-section" sx={{ mt: 5}}>
          <Stack direction="column" spacing={2}>
            <Stack direction="row" spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: deepOrange[500] }}>A</Avatar> 
              <Typography>
                Alif Zakiansyah As Syauqi
              </Typography>
              <Typography>
                222312958
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: deepPurple[500] }}>M</Avatar> 
              <Typography>
                Moses Noel Estomihi Simanullang
              </Typography>
              <Typography>
                222313217
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: purple['A100'] }}>N</Avatar> 
              <Typography>
                Narangga Khoirul Utama
              </Typography>
              <Typography>
                222313288
              </Typography>
            </Stack>
          </Stack>
        </Box>
        </div>
        <Copyright sx={{ my: 4 }} />
        <Zoom in={showScroll}>
          <Fab
            color="primary"
            size="medium"
            onClick={handleScrollTop}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 1201,
              boxShadow: 3
            }}
            aria-label="scroll to top"
          >
            <KeyboardArrowUpIcon sx={{ fontSize: 32 }} />
          </Fab>
        </Zoom>
      </Box>
    </Box >
  );
}
