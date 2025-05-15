import React, { useState } from 'react';
import { useTTS } from '../context/TTSContext';
import { generateSpeech } from '../api/ttsApi';
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
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import MicIcon from '@mui/icons-material/Mic';
import DownloadIcon from '@mui/icons-material/Download';
import AudioPlayer from '../components/AudioPlayer';

const TextToSpeechPage = () => {
  const {
    text, setText,
    selectedLanguage, setSelectedLanguage,
    selectedAvatar, setSelectedAvatar,
    audioUrl, setAudioUrl,
    processing, setProcessing,
    languages, avatars, loading, error
  } = useTTS();

  const [localError, setLocalError] = useState(null);
  
  // Get filtered avatars based on the selected language
  const filteredAvatars = selectedLanguage
    ? avatars.filter(avatar => 
        avatar.dialect?.startsWith(selectedLanguage) || 
        !avatar.dialect
      )
    : [];
  
  // Handle avatar gender selection
  const handleGenderSelect = (gender) => {
    if (filteredAvatars.length === 0) return;
    
    // Find an avatar with the specified gender and the current language
    const newAvatar = filteredAvatars.find(a => a.gender === gender && 
      (a.dialect?.startsWith(selectedLanguage) || !a.dialect));
    
    setSelectedAvatar(newAvatar || null);
  };
  
  // Handle dialect selection (within the same gender)
  const handleDialectSelect = (event) => {
    const dialectCode = event.target.value;
    if (!selectedAvatar) return;
    
    // Find an avatar with the same gender but different dialect
    const newAvatar = avatars.find(a => 
      a.gender === selectedAvatar.gender && 
      a.dialect === dialectCode
    );
    
    setSelectedAvatar(newAvatar || selectedAvatar);
  };
  
  // Find available dialects for the selected language and gender
  const availableDialects = selectedAvatar
    ? avatars.filter(a => 
        a.gender === selectedAvatar.gender && 
        a.dialect?.startsWith(selectedLanguage)
      )
    : [];
  
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!text.trim()) {
      setLocalError('Please enter some text to convert to speech');
      return;
    }
    
    if (!selectedLanguage) {
      setLocalError('Please select a language');
      return;
    }
    
    setLocalError(null);
    setProcessing(true);
    
    try {
      const result = await generateSpeech(
        text, 
        selectedLanguage, 
        selectedAvatar
      );
      
      setAudioUrl(result.file_url);
    } catch (err) {
      console.error('Error generating speech:', err);
      setLocalError('Failed to generate speech. Please try again later.');
    } finally {
      setProcessing(false);
    }
  };
  
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
        Text to Speech
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Text input */}
            <Grid item xs={12}>
              <TextField
                label="Text to convert to speech"
                multiline
                rows={6}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text here..."
                variant="outlined"
                required
              />
            </Grid>
            
            {/* Language selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="language-select-label">Language</InputLabel>
                <Select
                  labelId="language-select-label"
                  id="language-select"
                  value={selectedLanguage}
                  label="Language"
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  required
                >
                  {languages.map((language) => (
                    <MenuItem key={language.code} value={language.code}>
                      {language.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Avatar selection */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Voice Type
              </Typography>
              
              <RadioGroup
                row
                value={selectedAvatar?.gender || ''}
                onChange={(e) => handleGenderSelect(e.target.value)}
              >
                <FormControlLabel 
                  value="male" 
                  control={<Radio />} 
                  label="Male" 
                  disabled={!filteredAvatars.some(a => a.gender === 'male')}
                />
                <FormControlLabel 
                  value="female" 
                  control={<Radio />} 
                  label="Female" 
                  disabled={!filteredAvatars.some(a => a.gender === 'female')}
                />
              </RadioGroup>
              
              {selectedAvatar && availableDialects.length > 1 && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="dialect-select-label">Dialect</InputLabel>
                  <Select
                    labelId="dialect-select-label"
                    id="dialect-select"
                    value={selectedAvatar.dialect || ''}
                    label="Dialect"
                    onChange={handleDialectSelect}
                  >
                    {availableDialects.map((avatar) => (
                      <MenuItem key={avatar.dialect} value={avatar.dialect || ''}>
                        {avatar.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            
            {/* Error message */}
            {localError && (
              <Grid item xs={12}>
                <Alert severity="error">{localError}</Alert>
              </Grid>
            )}
            
            {/* Submit button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<MicIcon />}
                disabled={processing}
                fullWidth
              >
                {processing ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Generate Speech'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Audio player */}
      {audioUrl && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            Generated Audio
          </Typography>
          
          <AudioPlayer audioUrl={audioUrl} />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              href={audioUrl}
              download
              target="_blank"
            >
              Download MP3
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TextToSpeechPage; 