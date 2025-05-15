import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import AudioPlayer from './AudioPlayer';

const TextTruncate = styled(Typography)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  lineHeight: '1.5em',
  maxHeight: '3em'
});

const HistoryItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  
  const handleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handlePlayAudio = () => {
    setShowPlayer(!showPlayer);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Truncate text for display
  const displayText = item.text.length > 200 && !expanded
    ? `${item.text.substring(0, 200)}...`
    : item.text;
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Typography variant="subtitle2" color="text.secondary">
              {formatDate(item.created_at)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                {expanded ? (
                  <Typography variant="body1">{item.text}</Typography>
                ) : (
                  <TextTruncate variant="body1">{displayText}</TextTruncate>
                )}
              </Box>
              
              <IconButton 
                onClick={handleExpand}
                aria-expanded={expanded}
                aria-label="show more"
                size="small"
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`Language: ${item.language_code}`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              
              {item.avatar && (
                <Chip 
                  label={`Voice: ${item.avatar.gender} ${item.avatar.dialect || ''}`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              )}
              
              {item.model_id && (
                <Chip 
                  label={`Model: ${item.model_id}`} 
                  size="small" 
                  variant="outlined"
                />
              )}
              
              {item.duration_seconds && (
                <Chip 
                  label={`Duration: ${item.duration_seconds.toFixed(2)}s`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {item.file_url && (
              <Box>
                <Button
                  startIcon={<VolumeUpIcon />}
                  variant="contained"
                  color="primary"
                  onClick={handlePlayAudio}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  {showPlayer ? 'Hide Player' : 'Play Audio'}
                </Button>
                
                <Button
                  startIcon={<DownloadIcon />}
                  variant="outlined"
                  href={item.file_url}
                  download
                  target="_blank"
                  fullWidth
                >
                  Download
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
        
        {showPlayer && item.file_url && (
          <Collapse in={showPlayer} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <AudioPlayer audioUrl={item.file_url} />
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryItem; 