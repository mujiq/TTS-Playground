import React, { useState, useEffect } from 'react';
import { useTTS } from '../context/TTSContext';
import { submitBatchJob, getBatchJobStatus } from '../api/ttsApi';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

const BatchProcessingPage = () => {
  const { languages, avatars, loading, error } = useTTS();
  
  const [inputs, setInputs] = useState([{ text: '', language: 'en', avatar: null }]);
  const [localError, setLocalError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  
  // Add a new input row
  const addInputRow = () => {
    setInputs([...inputs, { text: '', language: 'en', avatar: null }]);
  };
  
  // Remove an input row
  const removeInputRow = (index) => {
    const newInputs = [...inputs];
    newInputs.splice(index, 1);
    setInputs(newInputs);
  };
  
  // Handle text input change
  const handleTextChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index].text = value;
    setInputs(newInputs);
  };
  
  // Handle language selection
  const handleLanguageChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index].language = value;
    
    // Reset avatar when language changes
    newInputs[index].avatar = null;
    setInputs(newInputs);
  };
  
  // Handle avatar selection
  const handleAvatarChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index].avatar = value;
    setInputs(newInputs);
  };
  
  // Get filtered avatars based on the selected language
  const getFilteredAvatars = (language) => {
    return language
      ? avatars.filter(avatar => 
          avatar.dialect?.startsWith(language) || 
          !avatar.dialect
        )
      : [];
  };
  
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate inputs
    for (let i = 0; i < inputs.length; i++) {
      if (!inputs[i].text.trim()) {
        setLocalError(`Please enter text for item ${i + 1}`);
        return;
      }
      
      if (!inputs[i].language) {
        setLocalError(`Please select a language for item ${i + 1}`);
        return;
      }
    }
    
    setLocalError(null);
    setProcessing(true);
    
    try {
      const result = await submitBatchJob(inputs);
      
      setJobStatus(result);
      
      // Add job to the list
      setJobs([result, ...jobs]);
      
      // Reset form
      setInputs([{ text: '', language: 'en', avatar: null }]);
    } catch (err) {
      console.error('Error submitting batch job:', err);
      setLocalError('Failed to submit batch job. Please try again later.');
    } finally {
      setProcessing(false);
    }
  };
  
  // Polling for job status updates
  useEffect(() => {
    if (!jobs.length) return;
    
    const interval = setInterval(async () => {
      try {
        const updatedJobs = [...jobs];
        let hasUpdates = false;
        
        for (let i = 0; i < updatedJobs.length; i++) {
          if (updatedJobs[i].status !== 'completed' && updatedJobs[i].status !== 'failed') {
            const result = await getBatchJobStatus(updatedJobs[i].id);
            updatedJobs[i] = result;
            hasUpdates = true;
          }
        }
        
        if (hasUpdates) {
          setJobs(updatedJobs);
        }
      } catch (err) {
        console.error('Error updating job status:', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [jobs]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Batch Processing
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Add Items to Process
          </Typography>
          
          {inputs.map((input, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={`Text for item ${index + 1}`}
                  multiline
                  rows={3}
                  fullWidth
                  value={input.text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  placeholder="Enter text here..."
                  variant="outlined"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={input.language}
                    label="Language"
                    onChange={(e) => handleLanguageChange(index, e.target.value)}
                    required
                  >
                    {languages.map((language) => (
                      <MenuItem key={language.code} value={language.code}>
                        {language.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Voice</InputLabel>
                  <Select
                    value={input.avatar ? JSON.stringify(input.avatar) : ''}
                    label="Voice"
                    onChange={(e) => handleAvatarChange(index, e.target.value ? JSON.parse(e.target.value) : null)}
                  >
                    <MenuItem value="">
                      <em>Default</em>
                    </MenuItem>
                    {getFilteredAvatars(input.language).map((avatar) => (
                      <MenuItem key={avatar.id} value={JSON.stringify(avatar)}>
                        {avatar.gender} - {avatar.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
                {inputs.length > 1 && (
                  <IconButton 
                    color="error" 
                    onClick={() => removeInputRow(index)}
                    sx={{ mt: -2 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
          
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              onClick={addInputRow}
              startIcon={<UploadFileIcon />}
            >
              Add Another Item
            </Button>
          </Box>
          
          {localError && (
            <Alert severity="error" sx={{ my: 2 }}>
              {localError}
            </Alert>
          )}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SendIcon />}
            disabled={processing}
          >
            {processing ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Submit Batch Job'
            )}
          </Button>
        </form>
      </Paper>
      
      {jobs.length > 0 && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            Batch Jobs
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={job.status} 
                        color={
                          job.status === 'completed' ? 'success' : 
                          job.status === 'failed' ? 'error' : 
                          job.status === 'processing' ? 'primary' : 
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {job.status === 'processing' && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(job.completed / job.total) * 100} 
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {Math.round((job.completed / job.total) * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {job.status !== 'processing' && (
                        <Typography variant="body2">
                          {job.completed} / {job.total}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{job.total}</TableCell>
                    <TableCell>
                      {new Date(job.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {job.status === 'completed' && (
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          size="small"
                          href={`/api/batch-tts/${job.id}/download`}
                          target="_blank"
                        >
                          Download All
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default BatchProcessingPage; 