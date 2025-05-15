import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const Header = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine which tab is active based on the current path
  const getTabValue = (path) => {
    if (path === '/') return 0;
    if (path === '/batch') return 1;
    if (path === '/models') return 2;
    if (path === '/monitoring') return 3;
    return 0;
  };

  const tabValue = getTabValue(location.pathname);

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <RecordVoiceOverIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            TextToSpeech Playground
          </Typography>
        </Box>

        {isMobile ? (
          // Mobile view: dropdown or hamburger menu could be implemented here
          <Box sx={{ flexGrow: 1 }} />
        ) : (
          // Desktop view: tabs
          <Tabs
            value={tabValue}
            textColor="inherit"
            indicatorColor="secondary"
            aria-label="navigation tabs"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="Text-to-Speech" component={RouterLink} to="/" />
            <Tab label="Batch Processing" component={RouterLink} to="/batch" />
            <Tab label="Models" component={RouterLink} to="/models" />
            <Tab label="System Monitoring" component={RouterLink} to="/monitoring" />
          </Tabs>
        )}

        {/* GitHub link removed */}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 