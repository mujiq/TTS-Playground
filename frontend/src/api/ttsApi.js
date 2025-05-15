import axios from 'axios';

// Base URL of the backend API
// Use relative URL to ensure it works with the load balancer in any environment
const API_BASE_URL = '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Text-to-Speech API functions
export const generateSpeech = async (text, language, avatar = null) => {
  try {
    const response = await api.post('/tts', {
      text,
      language,
      avatar,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

// Batch processing API functions
export const submitBatchJob = async (items) => {
  try {
    const response = await api.post('/batch-tts', {
      items,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting batch job:', error);
    throw error;
  }
};

export const getBatchJobStatus = async (jobId) => {
  try {
    const response = await api.get(`/batch-tts/${jobId}/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting batch job status:', error);
    throw error;
  }
};

// Model and language information API functions
export const getAvailableModels = async () => {
  try {
    const response = await api.get('/models');
    return response.data;
  } catch (error) {
    console.error('Error getting available models:', error);
    throw error;
  }
};

export const getSupportedLanguages = async () => {
  try {
    const response = await api.get('/languages');
    return response.data;
  } catch (error) {
    console.error('Error getting supported languages:', error);
    throw error;
  }
};

export const getAvailableAvatars = async () => {
  try {
    const response = await api.get('/avatars');
    return response.data;
  } catch (error) {
    console.error('Error getting available avatars:', error);
    throw error;
  }
};

// System monitoring API functions
export const getSystemStats = async () => {
  try {
    const response = await api.get('/system-stats');
    return response.data;
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
};

// Model management API functions
export const getHuggingFaceLeaderboard = async (limit = 10) => {
  try {
    const response = await api.get(`/models/huggingface-leaderboard?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error getting Hugging Face leaderboard:', error);
    throw error;
  }
};

export const downloadModel = async (modelId, optimize = true) => {
  try {
    const response = await api.post('/models/download', null, {
      params: { model_id: modelId, optimize },
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading model:', error);
    throw error;
  }
};

export const downloadMultipleModels = async (modelIds, optimize = true) => {
  try {
    const response = await api.post('/models/download-batch', { model_ids: modelIds, optimize });
    return response.data;
  } catch (error) {
    console.error('Error downloading multiple models:', error);
    throw error;
  }
};

export const deleteModel = async (modelId) => {
  try {
    const response = await api.delete(`/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
};

export default {
  generateSpeech,
  submitBatchJob,
  getBatchJobStatus,
  getAvailableModels,
  getSupportedLanguages,
  getAvailableAvatars,
  getSystemStats,
  getHuggingFaceLeaderboard,
  downloadModel,
  downloadMultipleModels,
  deleteModel,
}; 