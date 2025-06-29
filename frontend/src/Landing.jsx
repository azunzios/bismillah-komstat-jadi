import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import AppAppBar from './components/AppAppBar';

export default function Landing() {
  return (
    <>
      <CssBaseline />
      <AppAppBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)', // Account for AppBar height
          mt: 8, // Add margin top for AppBar
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          color: '#fff',
          textAlign: 'center',
          px: 3,
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Greenhouse Gas Effect Dashboard
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, maxWidth: 600 }}>
          Telusuri data dan analisis emisi Gas Rumah Kaca global untuk memahami dampaknya dan mendorong aksi nyata melawan perubahan iklim.
        </Typography>
        <Button
          variant="contained"
          size="large"
          color="success"
          component={Link}
          to="/dashboard"
          sx={{ textTransform: 'none', fontSize: '1rem', px: 4 }}
        >
          Masuk ke Dashboard
        </Button>
      </Box>
    </>
  );
}
