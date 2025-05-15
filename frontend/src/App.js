import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

// Pages
import TextToSpeechPage from './pages/TextToSpeechPage';
import BatchProcessingPage from './pages/BatchProcessingPage';
import MonitoringPage from './pages/MonitoringPage';
import ModelsPage from './pages/ModelsPage';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Context Provider
import { TTSProvider } from './context/TTSContext';

function App() {
  return (
    <TTSProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header />
        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Routes>
            <Route path="/" element={<TextToSpeechPage />} />
            <Route path="/batch" element={<BatchProcessingPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </TTSProvider>
  );
}

export default App; 