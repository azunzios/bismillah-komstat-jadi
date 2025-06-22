import * as React from 'react';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import type {} from '@mui/x-tree-view/themeAugmentation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Header from './components/Header';
import MainGrid from './components/MainGrid';
import AppTheme from './theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

/**
 * Dashboard component that serves as the main container for the application.
 * 
 * This component utilizes the AppTheme to provide theming support across the application.
 * It includes the AppAppBar, Header, and MainGrid components for layout and content display.
 * 
 * @param {Object} props - Component properties.
 * @param {boolean} [props.disableCustomTheme] - Optional flag to disable the custom theme.
 * 
 * @returns {JSX.Element} The rendered JSX element.
 */
export default function Dashboard(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        px: '0vw',
        width: '100vw',
        position: 'relative'
      }}>
        {/* Top Navigation */}
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
        <AppAppBar />
        </Box>
        {/* Main Content Area */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            mt: 20,
            px: '0vw'
          })}
        >
          <Stack
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
            }}
          >
            <MainGrid />
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
