import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InfoIcon from '@mui/icons-material/Info';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ColorModeIconDropdown from '.././theme/ColorModeIconDropdown';
import Sitemark from './SitemarkIcon';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  width: '100%',
  padding: '10px', // default (mobile)

  [theme.breakpoints.up('md')]: {
    padding: '8px 162px',
  },
}));


export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const navItems = [
    { label: 'Beranda', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Analitics', onClick: undefined },
    { label: 'Tentang Kami', onClick: () => {
        const el = document.getElementById('tentang-kami-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }
  ];

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 'none',
        bgcolor: 'transparent',
        backgroundImage: 'none',
        width: "100vw",
        color: "#fff", // Tetap putih, tidak ada mode gelap/terang
      }}
    >
      <Box sx={{
        height: 'auto',
        backgroundColor: '#00B140',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 0, px: 0, m: 0,
        color: "#fff",
      }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            color: "#fff",
            m: 1, p: 0,
            cursor: 'pointer',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'text-decoration-thickness 0.2s',
            '&:hover': {
              textDecoration: 'underline',
              textDecorationThickness: '5px',
              textUnderlineOffset: '4px',
            }
          }}
          onClick={() => {
            const yOffset = -90; // sesuaikan dengan tinggi AppBar
            const el = document.getElementById('tahun-area-section');
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
        >
          Lihat dashboard statistik GHGE Global
        </Typography>
      </Box>
      <Container maxWidth={false} disableGutters sx={{ px:0 }}>
        <StyledToolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Sitemark />
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexGrow: 1,
                maxWidth: 600,
                alignItems: 'center',
                py: 1,
                ml: 6
              }}
            >
              {navItems.map((item, idx) => (
                <Button
                  key={item.label}
                  variant="text"
                  size="small"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' },
                    color: "#fff",
                    fontWeight: 700,
                    lineHeight: 1
                  }}
                  disableRipple
                  onClick={item.onClick}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Stack sx={{ alignItems: 'center', flexDirection: 'row', flexGrow: 1, gap: 5 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: '#fff', gap: 1, flex: 1, minWidth: 0, cursor: 'pointer', fontWeight: '500', textDecoration: 'none', '&:hover': { textDecoration: 'underline', textDecorationThickness: '5px' }, lineHeight: 1 }}
                onClick={() => window.open('https://api.worldbank.org/v2/en/indicator/EN.GHG.ALL.MT.CE.AR5?downloadformat=csv', '_blank')}
              >
                <FileDownloadIcon fontSize="small" />
                Download Data ini
              </Typography>
            </Stack>
            {/* Hapus ColorModeIconDropdown */}
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            {/* Hapus ColorModeIconDropdown */}
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
            >
              <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                {navItems.map((item, idx) => (
                  <MenuItem
                    key={item.label}
                    sx={{ justifyContent: 'flex-start', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline', textDecorationThickness: '5px', textUnderlineOffset: '4px' } }}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
