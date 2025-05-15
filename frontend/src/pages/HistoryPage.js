import React, { useState, useEffect } from 'react';
import { getTTSHistory } from '../api/ttsApi';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import HistoryItem from '../components/HistoryItem';
import Paper from '@mui/material/Paper';

const HistoryPage = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * pageSize;
        const result = await getTTSHistory(pageSize, offset);
        
        setHistoryItems(result.items);
        setTotalItems(result.total);
        setError(null);
      } catch (err) {
        console.error('Error fetching TTS history:', err);
        setError('Failed to load TTS history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [page, pageSize]);
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Handle items per page change
  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setPage(1); // Reset to first page when changing page size
  };
  
  if (loading && !historyItems.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        TTS Conversion History
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="body1">
              {totalItems > 0
                ? `Showing ${Math.min((page - 1) * pageSize + 1, totalItems)}-${Math.min(page * pageSize, totalItems)} of ${totalItems} conversions`
                : 'No conversions found'
              }
            </Typography>
          </Grid>
          
          <Grid item>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="page-size-select-label">Show</InputLabel>
              <Select
                labelId="page-size-select-label"
                id="page-size-select"
                value={pageSize}
                label="Show"
                onChange={handlePageSizeChange}
              >
                <MenuItem value={5}>5 per page</MenuItem>
                <MenuItem value={10}>10 per page</MenuItem>
                <MenuItem value={25}>25 per page</MenuItem>
                <MenuItem value={50}>50 per page</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {historyItems.length > 0 ? (
        <Box>
          {historyItems.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                showFirstButton 
                showLastButton
              />
            </Box>
          )}
        </Box>
      ) : (
        <Alert severity="info" sx={{ my: 2 }}>
          No TTS conversion history found. Try converting some text to speech first!
        </Alert>
      )}
    </Box>
  );
};

export default HistoryPage; 