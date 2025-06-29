import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Analysis() {
  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analisis Emisi Gas Rumah Kaca
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 600, textAlign: 'center' }}>
          Halaman ini akan menampilkan analisis mendalam mengenai tren emisi Gas Rumah Kaca (GHGE) global,
          termasuk visualisasi interaktif, insight, dan temuan penting. Konten akan segera hadir.
        </Typography>
      </Box>
    </>
  );
}
