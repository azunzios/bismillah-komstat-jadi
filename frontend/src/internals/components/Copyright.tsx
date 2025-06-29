import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import ReactCountryFlag from 'react-country-flag';
import Box from '@mui/material/Box';

export default function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      align="center"
      {...props}
      sx={[
        {
          color: 'text.secondary',
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {'Copyright © '}
      <Link color="inherit" href="https://stis.ac.id">
      Kelompok 1 2KS1
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <ReactCountryFlag
                countryCode="ID"
                svg
                style={{
                  width: '1.5em',
                  height: '1em',
                  borderRadius: '2px',
                  boxShadow: '0 0 1px 0px #888',
                }}
                title="Indonesia"
              />
              <span>Indonesia</span>
            </Box>
    </Typography>
  );
}
