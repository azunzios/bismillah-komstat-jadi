import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
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
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  padding: '8px 3vw',
  width: "100%",
}));

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const navItems = ['Beranda','Analitics','Informasi Data','Petunjuk Penggunaan'];

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        width: "100vw",
      }}
    >
      <Container maxWidth={false} disableGutters>
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Sitemark />
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexGrow: 1,
                maxWidth: 600,
                alignItems: 'center',
              }}
            >
              <Divider orientation="vertical" flexItem />
              {navItems.map((label, idx) => (
                <React.Fragment key={label}>
                  <Button variant="text" color="info" size="small" sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', textAlign: 'left', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }} disableRipple>
                    {label}
                  </Button>
                  <Divider orientation="vertical" flexItem />
                </React.Fragment>
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
            <Divider orientation="vertical" flexItem />
            <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />}
              sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', gap: 0.5, flex: 1, minWidth: 0, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline', textDecorationThickness: '3px' } }}>
                Download Data ini
                <FileDownloadIcon fontSize="small" />
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', gap: 0.5, flex: 1, minWidth: 0, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline', textDecorationThickness: '3px' } }}>
                Tentang Kami
              </Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <ColorModeIconDropdown />
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <ColorModeIconDropdown size="medium" />
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

                <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
                <MenuItem sx={{ justifyContent: 'flex-start', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>Beranda</MenuItem>
                <MenuItem sx={{ justifyContent: 'flex-start', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>Analitics</MenuItem>
                <MenuItem sx={{ justifyContent: 'flex-start', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>Informasi Data</MenuItem>
                <MenuItem sx={{ justifyContent: 'flex-start', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>Petunjuk Penggunaan</MenuItem>
                <Divider sx={{ my: 0}} />
                <MenuItem>
                  <Button variant="text" color="primary" fullWidth sx={{ textTransform: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline', textDecorationThickness: '3px', backgroundColor: 'transparent' } }}>
                    Tentang Kami
                  </Button>
                </MenuItem>
                <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
