import React, { useState, useEffect, useRef } from 'react';
import { getSystemStats } from '../api/ttsApi';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const MonitoringPage = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [activeTab, setActiveTab] = useState(0);
  const [timeSeriesData, setTimeSeriesData] = useState({
    labels: [],
    cpuData: [],
    memoryData: [],
    gpuData: []
  });
  
  // Reference to store the interval ID
  const intervalRef = useRef(null);
  
  // Fetch system stats initially and set up polling
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const stats = await getSystemStats();
        setSystemStats(stats);
        
        // Update time series data
        setTimeSeriesData(prev => {
          const now = new Date().toLocaleTimeString();
          
          // Keep the last 20 data points
          const labels = [...prev.labels, now].slice(-20);
          const cpuData = [...prev.cpuData, stats.cpu.usage.toFixed(2)].slice(-20);
          const memoryData = [...prev.memoryData, stats.memory.used_percent.toFixed(2)].slice(-20);
          
          // Average GPU usage if multiple GPUs
          const avgGpuUsage = stats.gpus.length 
            ? stats.gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / stats.gpus.length 
            : 0;
          
          const gpuData = [...prev.gpuData, avgGpuUsage.toFixed(2)].slice(-20);
          
          return { labels, cpuData, memoryData, gpuData };
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching system stats:', err);
        setError('Failed to fetch system statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch initially
    fetchStats();
    
    // Set up interval for polling
    intervalRef.current = setInterval(fetchStats, refreshInterval * 1000);
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (event) => {
    const newInterval = event.target.value;
    setRefreshInterval(newInterval);
    
    // Reset the polling interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(async () => {
      try {
        const stats = await getSystemStats();
        setSystemStats(stats);
        
        // Update time series data
        setTimeSeriesData(prev => {
          const now = new Date().toLocaleTimeString();
          const labels = [...prev.labels, now].slice(-20);
          const cpuData = [...prev.cpuData, stats.cpu.usage.toFixed(2)].slice(-20);
          const memoryData = [...prev.memoryData, stats.memory.used_percent.toFixed(2)].slice(-20);
          
          const avgGpuUsage = stats.gpus.length 
            ? stats.gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / stats.gpus.length 
            : 0;
          
          const gpuData = [...prev.gpuData, avgGpuUsage.toFixed(2)].slice(-20);
          
          return { labels, cpuData, memoryData, gpuData };
        });
      } catch (err) {
        console.error('Error fetching system stats:', err);
      }
    }, newInterval * 1000);
  };
  
  // Chart options for time series
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'System Resource Usage Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)',
        },
      },
    },
    animation: {
      duration: 0 // Disable animations for better performance with frequent updates
    }
  };
  
  // Chart data for time series
  const chartData = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        fill: true,
        label: 'CPU Usage (%)',
        data: timeSeriesData.cpuData,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        fill: true,
        label: 'Memory Usage (%)',
        data: timeSeriesData.memoryData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        fill: true,
        label: 'GPU Usage (%)',
        data: timeSeriesData.gpuData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  
  if (loading && !systemStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !systemStats) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Monitoring
        </Typography>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="refresh-interval-label">Refresh</InputLabel>
          <Select
            labelId="refresh-interval-label"
            id="refresh-interval"
            value={refreshInterval}
            label="Refresh"
            onChange={handleRefreshIntervalChange}
          >
            <MenuItem value={1}>1 second</MenuItem>
            <MenuItem value={5}>5 seconds</MenuItem>
            <MenuItem value={10}>10 seconds</MenuItem>
            <MenuItem value={30}>30 seconds</MenuItem>
            <MenuItem value={60}>1 minute</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Time Series Chart */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Line options={chartOptions} data={chartData} />
      </Paper>
      
      {/* Resource Usage Tabs */}
      <Paper sx={{ mb: 4 }} elevation={2}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="resource tabs">
          <Tab label="Overview" />
          <Tab label="CPU" />
          <Tab label="Memory" />
          <Tab label="GPU" />
          <Tab label="Disk" />
          <Tab label="Network" />
        </Tabs>
        
        <Box p={3}>
          {/* Overview Tab */}
          {activeTab === 0 && systemStats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      CPU Usage
                    </Typography>
                    <Typography variant="h4" component="div">
                      {systemStats.cpu.usage.toFixed(2)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={systemStats.cpu.usage} 
                          color={systemStats.cpu.usage > 80 ? "error" : "primary"}
                        />
                      </Box>
                    </Box>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {systemStats.cpu.core_count} Cores
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Memory Usage
                    </Typography>
                    <Typography variant="h4" component="div">
                      {systemStats.memory.used_percent.toFixed(2)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={systemStats.memory.used_percent} 
                          color={systemStats.memory.used_percent > 80 ? "error" : "primary"}
                        />
                      </Box>
                    </Box>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {(systemStats.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(systemStats.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      GPU Usage
                    </Typography>
                    {systemStats.gpus.length > 0 ? (
                      <>
                        <Typography variant="h4" component="div">
                          {(systemStats.gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / systemStats.gpus.length).toFixed(2)}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={systemStats.gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / systemStats.gpus.length} 
                              color={systemStats.gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / systemStats.gpus.length > 80 ? "error" : "primary"}
                            />
                          </Box>
                        </Box>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                          {systemStats.gpus.length} GPUs Available
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No GPUs detected
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Disk Usage
                    </Typography>
                    <Typography variant="h4" component="div">
                      {systemStats.disk.used_percent.toFixed(2)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={systemStats.disk.used_percent} 
                          color={systemStats.disk.used_percent > 90 ? "error" : "primary"}
                        />
                      </Box>
                    </Box>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {(systemStats.disk.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(systemStats.disk.total / 1024 / 1024 / 1024).toFixed(2)} GB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Network Traffic
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1" color="text.secondary">
                          Upload
                        </Typography>
                        <Typography variant="h5" component="div">
                          {(systemStats.network.bytes_sent / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" color="text.secondary">
                          Download
                        </Typography>
                        <Typography variant="h5" component="div">
                          {(systemStats.network.bytes_recv / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      System Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body1" color="text.secondary">
                          Hostname
                        </Typography>
                        <Typography variant="body1">
                          {systemStats.system.hostname}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body1" color="text.secondary">
                          Platform
                        </Typography>
                        <Typography variant="body1">
                          {systemStats.system.platform}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body1" color="text.secondary">
                          Uptime
                        </Typography>
                        <Typography variant="body1">
                          {Math.floor(systemStats.system.uptime / 86400)} days, {Math.floor((systemStats.system.uptime % 86400) / 3600)} hours
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          
          {/* CPU Tab */}
          {activeTab === 1 && systemStats && (
            <Box>
              <Typography variant="h6" gutterBottom>
                CPU Details
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Core</TableCell>
                      <TableCell>Usage (%)</TableCell>
                      <TableCell>Frequency (MHz)</TableCell>
                      <TableCell>Load</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemStats.cpu.per_core.map((core, index) => (
                      <TableRow key={index}>
                        <TableCell>Core {index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={core.usage} 
                                color={core.usage > 80 ? "error" : "primary"}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {core.usage.toFixed(2)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{core.frequency}</TableCell>
                        <TableCell>{(core.load || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* Memory Tab */}
          {activeTab === 2 && systemStats && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Memory Usage
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={systemStats.memory.used_percent} 
                            color={systemStats.memory.used_percent > 80 ? "error" : "primary"}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {systemStats.memory.used_percent.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Total</TableCell>
                              <TableCell align="right">{(systemStats.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Used</TableCell>
                              <TableCell align="right">{(systemStats.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Free</TableCell>
                              <TableCell align="right">{(systemStats.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Swap Usage
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={systemStats.memory.swap.used_percent} 
                            color={systemStats.memory.swap.used_percent > 50 ? "error" : "primary"}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {systemStats.memory.swap.used_percent.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Total</TableCell>
                              <TableCell align="right">{(systemStats.memory.swap.total / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Used</TableCell>
                              <TableCell align="right">{(systemStats.memory.swap.used / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Free</TableCell>
                              <TableCell align="right">{(systemStats.memory.swap.free / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* GPU Tab */}
          {activeTab === 3 && systemStats && (
            <Box>
              {systemStats.gpus.length > 0 ? (
                <Grid container spacing={3}>
                  {systemStats.gpus.map((gpu, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {gpu.name || `GPU ${index + 1}`}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Utilization
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={gpu.utilization} 
                                color={gpu.utilization > 80 ? "error" : "primary"}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {gpu.utilization.toFixed(2)}%
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Memory Usage
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(gpu.memory.used / gpu.memory.total) * 100} 
                                color={(gpu.memory.used / gpu.memory.total) * 100 > 80 ? "error" : "primary"}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {((gpu.memory.used / gpu.memory.total) * 100).toFixed(2)}%
                              </Typography>
                            </Box>
                          </Box>
                          
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell>Temperature</TableCell>
                                  <TableCell align="right">{gpu.temperature}°C</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Memory</TableCell>
                                  <TableCell align="right">{(gpu.memory.used / 1024).toFixed(2)} GB / {(gpu.memory.total / 1024).toFixed(2)} GB</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Power</TableCell>
                                  <TableCell align="right">{gpu.power} W</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No GPUs detected in the system
                </Typography>
              )}
            </Box>
          )}
          
          {/* Disk Tab */}
          {activeTab === 4 && systemStats && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Disk Usage
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Disk</TableCell>
                      <TableCell>Mount Point</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Used</TableCell>
                      <TableCell>Free</TableCell>
                      <TableCell>Usage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemStats.disk.partitions.map((partition, index) => (
                      <TableRow key={index}>
                        <TableCell>{partition.device}</TableCell>
                        <TableCell>{partition.mountpoint}</TableCell>
                        <TableCell>{(partition.total / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                        <TableCell>{(partition.used / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                        <TableCell>{(partition.free / 1024 / 1024 / 1024).toFixed(2)} GB</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={partition.percent} 
                                color={partition.percent > 90 ? "error" : "primary"}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {partition.percent.toFixed(2)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Disk I/O
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Disk</TableCell>
                      <TableCell>Read Speed</TableCell>
                      <TableCell>Write Speed</TableCell>
                      <TableCell>Read Count</TableCell>
                      <TableCell>Write Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemStats.disk.io.map((io, index) => (
                      <TableRow key={index}>
                        <TableCell>{io.device}</TableCell>
                        <TableCell>{(io.read_bytes / 1024 / 1024).toFixed(2)} MB/s</TableCell>
                        <TableCell>{(io.write_bytes / 1024 / 1024).toFixed(2)} MB/s</TableCell>
                        <TableCell>{io.read_count}</TableCell>
                        <TableCell>{io.write_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* Network Tab */}
          {activeTab === 5 && systemStats && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Network Interfaces
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Interface</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Received</TableCell>
                      <TableCell>Sent</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemStats.network.interfaces.map((iface, index) => (
                      <TableRow key={index}>
                        <TableCell>{iface.name}</TableCell>
                        <TableCell>{iface.address}</TableCell>
                        <TableCell>{(iface.bytes_recv / 1024 / 1024).toFixed(2)} MB</TableCell>
                        <TableCell>{(iface.bytes_sent / 1024 / 1024).toFixed(2)} MB</TableCell>
                        <TableCell>
                          <Chip 
                            label={iface.status} 
                            color={iface.status === 'up' ? 'success' : 'error'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Network Connections
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Local Address</TableCell>
                      <TableCell>Remote Address</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>PID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemStats.network.connections.slice(0, 10).map((conn, index) => (
                      <TableRow key={index}>
                        <TableCell>{conn.type}</TableCell>
                        <TableCell>{`${conn.local_address}:${conn.local_port}`}</TableCell>
                        <TableCell>{`${conn.remote_address}:${conn.remote_port}`}</TableCell>
                        <TableCell>{conn.status}</TableCell>
                        <TableCell>{conn.pid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {systemStats.network.connections.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Showing 10 of {systemStats.network.connections.length} connections
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MonitoringPage; 