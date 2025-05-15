import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSupportedLanguages, getAvailableAvatars } from '../api/ttsApi';

// Create context
const TTSContext = createContext();

// Custom hook to use TTS context
export const useTTS = () => {
  return useContext(TTSContext);
};

export const TTSProvider = ({ children }) => {
  // State for languages and avatars
  const [languages, setLanguages] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for current TTS session
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Load languages and avatars on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching TTS data from API...');
        
        // Hardcoded fallback data in case the API is not responding
        const fallbackLanguages = [
          { code: 'en', name: 'English' },
          { code: 'ar', name: 'Arabic' },
          { code: 'es', name: 'Spanish' },
          { code: 'hi', name: 'Hindi' },
          { code: 'ur', name: 'Urdu' }
        ];
        
        const fallbackAvatars = [
          { gender: 'male', dialect: 'en-US', description: 'American English Male Voice' },
          { gender: 'female', dialect: 'en-US', description: 'American English Female Voice' },
          { gender: 'male', dialect: 'en-GB', description: 'British English Male Voice' },
          { gender: 'female', dialect: 'en-GB', description: 'British English Female Voice' }
        ];
        
        try {
          // Load languages from the API with timeout
          const languagesPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('Languages API timeout')), 5000);
            getSupportedLanguages()
              .then(data => {
                clearTimeout(timeoutId);
                console.log('Languages data received:', data);
                resolve(data);
              })
              .catch(err => {
                clearTimeout(timeoutId);
                reject(err);
              });
          });
          
          // Load avatars from the API with timeout
          const avatarsPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('Avatars API timeout')), 5000);
            getAvailableAvatars()
              .then(data => {
                clearTimeout(timeoutId);
                console.log('Avatars data received:', data);
                resolve(data);
              })
              .catch(err => {
                clearTimeout(timeoutId);
                reject(err);
              });
          });
          
          // Try to load from API first
          const [languagesData, avatarsData] = await Promise.all([
            languagesPromise,
            avatarsPromise
          ]);
          
          setLanguages(languagesData);
          setAvatars(avatarsData);
        } catch (apiError) {
          console.error('API Error:', apiError);
          console.log('Using fallback data instead');
          
          // Use fallback data if API fails
          setLanguages(fallbackLanguages);
          setAvatars(fallbackAvatars);
        }
        
        // Set default language to English if available
        setSelectedLanguage('en');
        
        setLoading(false);
      } catch (err) {
        console.error('Error in TTS context:', err);
        setError('Failed to load languages and avatars. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Reset the audio player
  const resetAudio = () => {
    setAudioUrl('');
  };
  
  // Value object to be provided to consumers
  const value = {
    // Data
    languages,
    avatars,
    loading,
    error,
    
    // Current session state
    text,
    setText,
    selectedLanguage,
    setSelectedLanguage,
    selectedAvatar,
    setSelectedAvatar,
    audioUrl,
    setAudioUrl,
    processing,
    setProcessing,
    resetAudio,
  };
  
  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
}; 