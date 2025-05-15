import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Box,
  Chip,
  Divider,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  LinearProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Language as LanguageIcon,
  Memory as MemoryIcon,
  SpeakerPhone as SpeakerIcon,
} from '@mui/icons-material';
import * as ttsApi from '../api/ttsApi';

// Tab panel component for organizing content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`models-tabpanel-${index}`}
      aria-labelledby={`models-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ModelsPage = () => {
  // State for tab selection
  const [tabValue, setTabValue] = useState(0);
  
  // State for installed models
  const [installedModels, setInstalledModels] = useState([]);
  const [loadingInstalledModels, setLoadingInstalledModels] = useState(true);
  
  // State for Hugging Face leaderboard
  const [leaderboardModels, setLeaderboardModels] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  
  // State for model operations
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [optimize, setOptimize] = useState(true);
  
  // State for dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  
  // State for notifications
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'info' });

  // Fetch installed models
  const fetchInstalledModels = async () => {
    setLoadingInstalledModels(true);
    try {
      const data = await ttsApi.getAvailableModels();
      setInstalledModels(data);
    } catch (error) {
      console.error('Error fetching installed models:', error);
      setNotification({
        show: true,
        message: 'Failed to load installed models',
        severity: 'error',
      });
    } finally {
      setLoadingInstalledModels(false);
    }
  };

  // Fetch Hugging Face leaderboard
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await ttsApi.getHuggingFaceLeaderboard(10);
      setLeaderboardModels(data);
    } catch (error) {
      console.error('Error fetching Hugging Face leaderboard:', error);
      setNotification({
        show: true,
        message: 'Failed to load Hugging Face leaderboard',
        severity: 'error',
      });
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchInstalledModels();
    fetchLeaderboard();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle model download
  const handleDownloadModel = async (modelId) => {
    setIsDownloading(true);
    setDownloadProgress((prev) => ({ ...prev, [modelId]: 0 }));
    
    // Mock progress updates (in a real app, you'd get progress from backend)
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        const currentProgress = prev[modelId] || 0;
        if (currentProgress >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [modelId]: currentProgress + 10 };
      });
    }, 1000);
    
    try {
      const result = await ttsApi.downloadModel(modelId, optimize);
      
      clearInterval(progressInterval);
      setDownloadProgress((prev) => ({ ...prev, [modelId]: 100 }));
      
      if (result.success) {
        setNotification({
          show: true,
          message: `Model ${modelId} downloaded successfully`,
          severity: 'success',
        });
        
        // Refresh installed models list
        fetchInstalledModels();
      } else {
        setNotification({
          show: true,
          message: `Failed to download model: ${result.message}`,
          severity: 'error',
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error downloading model:', error);
      setNotification({
        show: true,
        message: 'Error downloading model: ' + (error.message || 'Unknown error'),
        severity: 'error',
      });
    } finally {
      setIsDownloading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[modelId];
          return newProgress;
        });
      }, 3000);
    }
  };

  // Handle model deletion
  const handleDeleteModel = async (modelId) => {
    try {
      const result = await ttsApi.deleteModel(modelId);
      
      if (result.success) {
        setNotification({
          show: true,
          message: `Model ${modelId} deleted successfully`,
          severity: 'success',
        });
        
        // Refresh installed models list
        fetchInstalledModels();
      } else {
        setNotification({
          show: true,
          message: `Failed to delete model: ${result.message}`,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      setNotification({
        show: true,
        message: 'Error deleting model: ' + (error.message || 'Unknown error'),
        severity: 'error',
      });
    }
  };

  // Open dialog
  const openDialog = (type, model) => {
    setDialogType(type);
    setSelectedModel(model);
    setDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
  };

  // Handle dialog confirm
  const handleDialogConfirm = () => {
    if (dialogType === 'delete' && selectedModel) {
      handleDeleteModel(selectedModel.id);
    }
    closeDialog();
  };

  // Render installed models section
  const renderInstalledModels = () => {
    if (loadingInstalledModels) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (installedModels.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No models are currently installed. Download models from the Hugging Face tab.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {installedModels.map((model) => (
          <Grid item xs={12} md={6} key={model.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {model.name}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {model.id}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {model.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {model.optimized && (
                    <Chip 
                      icon={<MemoryIcon />}
                      label="Optimized"
                      color="success"
                      size="small"
                    />
                  )}
                  {model.languages && model.languages.map((lang) => (
                    <Chip 
                      key={lang}
                      icon={<LanguageIcon />}
                      label={lang}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  startIcon={<DeleteIcon />}
                  color="error"
                  size="small"
                  onClick={() => openDialog('delete', model)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render HuggingFace leaderboard section
  const renderLeaderboard = () => {
    if (loadingLeaderboard) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (leaderboardModels.length === 0) {
      return (
        <Alert severity="warning" sx={{ my: 2 }}>
          Unable to load Hugging Face leaderboard. Please try refreshing.
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Top TTS Models on Hugging Face
          </Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={optimize}
                  onChange={(e) => setOptimize(e.target.checked)}
                  color="primary"
                />
              }
              label="Optimize for GPU"
            />
            <Tooltip title="Refresh leaderboard">
              <IconButton onClick={fetchLeaderboard} disabled={loadingLeaderboard}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {leaderboardModels.map((model) => {
            const isDownloaded = installedModels.some(m => m.id === model.id);
            const isDownloading = downloadProgress[model.id] !== undefined;
            
            return (
              <React.Fragment key={model.id}>
                <ListItem
                  secondaryAction={
                    isDownloaded ? (
                      <Chip
                        icon={<CheckIcon />}
                        label="Installed"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Button
                        startIcon={<DownloadIcon />}
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={isDownloading || isDownloading}
                        onClick={() => handleDownloadModel(model.id)}
                      >
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <SpeakerIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {model.name || model.id.split('/').pop()}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {` (${model.id})`}
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {model.description || 'No description available'}
                        </Typography>
                        {isDownloading && (
                          <LinearProgress 
                            variant="determinate" 
                            value={downloadProgress[model.id]} 
                            sx={{ mt: 1 }}
                          />
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Model Management
      </Typography>
      
      {notification.show && (
        <Alert 
          severity={notification.severity} 
          sx={{ mb: 2 }}
          onClose={() => setNotification({ ...notification, show: false })}
        >
          {notification.message}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="model management tabs"
        >
          <Tab label="Installed Models" id="models-tab-0" />
          <Tab label="Hugging Face Models" id="models-tab-1" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderInstalledModels()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderLeaderboard()}
      </TabPanel>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogType === 'delete' ? 'Delete Model' : 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogType === 'delete' && selectedModel && (
              `Are you sure you want to delete the model ${selectedModel.name || selectedModel.id}? This action cannot be undone.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={handleDialogConfirm} 
            autoFocus
            color={dialogType === 'delete' ? 'error' : 'primary'}
          >
            {dialogType === 'delete' ? 'Delete' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ModelsPage; 