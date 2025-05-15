import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const AudioPlayer = ({ audioUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [prevVolume, setPrevVolume] = useState(1.0); // To remember volume when muted

  useEffect(() => {
    // Reset state when audioUrl changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Clean up
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (_, newValue) => {
    const audio = audioRef.current;
    audio.currentTime = newValue;
    setCurrentTime(newValue);
  };

  const handleVolumeChange = (_, newValue) => {
    const audio = audioRef.current;
    setVolume(newValue);
    audio.volume = newValue;
    if (newValue > 0) {
      setPrevVolume(newValue);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    
    if (volume > 0) {
      setVolume(0);
      audio.volume = 0;
    } else {
      setVolume(prevVolume);
      audio.volume = prevVolume;
    }
  };

  // Format time as mm:ss
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeOffIcon />;
    if (volume < 0.5) return <VolumeDownIcon />;
    return <VolumeUpIcon />;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton onClick={togglePlayPause} size="large" color="primary">
          {isPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
        </IconButton>
        
        <Stack spacing={2} direction="row" sx={{ flex: 1, ml: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          
          <Slider
            value={currentTime}
            onChange={handleTimeChange}
            max={duration || 100}
            aria-label="time-indicator"
            size="small"
          />
          
          <Typography variant="body2" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Stack>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <IconButton onClick={toggleMute} size="small">
          {getVolumeIcon()}
        </IconButton>
        
        <Slider
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          min={0}
          max={1}
          step={0.01}
          sx={{ width: 100, ml: 1 }}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default AudioPlayer; 