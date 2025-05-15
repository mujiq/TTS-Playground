// Mock API responses for Jest tests

// Mock data
const mockLanguages = [
  { code: 'en', name: 'English', dialects: [
    { code: 'en-US', name: 'American English' },
    { code: 'en-GB', name: 'British English' }
  ]},
  { code: 'es', name: 'Spanish', dialects: [
    { code: 'es-ES', name: 'Castilian Spanish' }
  ]},
  { code: 'ar', name: 'Arabic', dialects: [
    { code: 'ar-SA', name: 'Saudi Arabian Arabic' },
    { code: 'ar-EG', name: 'Egyptian Arabic' }
  ]}
];

const mockAvatars = [
  { gender: 'male', dialect: 'en-US', description: 'American English Male Voice' },
  { gender: 'female', dialect: 'en-US', description: 'American English Female Voice' },
  { gender: 'male', dialect: 'en-GB', description: 'British English Male Voice' },
  { gender: 'female', dialect: 'en-GB', description: 'British English Female Voice' }
];

const mockModels = [
  { id: 'xtts-v2', name: 'XTTS v2', description: 'High-quality multilingual TTS model' },
  { id: 'bark', name: 'Bark', description: 'Multilingual text-to-audio model' },
  { id: 'spark-tts', name: 'Spark TTS', description: 'Efficient and high-quality TTS model' }
];

const mockSystemStats = {
  total_nodes: 3,
  active_workers: 4,
  gpu_usage: [
    { gpu_id: 0, usage_percent: 45, memory_used: 2048, memory_total: 8192 },
    { gpu_id: 1, usage_percent: 12, memory_used: 1024, memory_total: 8192 },
    { gpu_id: 2, usage_percent: 0, memory_used: 0, memory_total: 8192 }
  ],
  cpu_usage_percent: 23,
  memory_usage: { used_gb: 12, total_gb: 64 },
  pending_requests: 0,
  completed_requests_last_hour: 45
};

// Mock API functions
export const getSupportedLanguages = jest.fn().mockResolvedValue(mockLanguages);
export const getAvailableAvatars = jest.fn().mockResolvedValue(mockAvatars);
export const getAvailableModels = jest.fn().mockResolvedValue(mockModels);
export const getSystemStats = jest.fn().mockResolvedValue(mockSystemStats);

export const generateSpeech = jest.fn().mockResolvedValue({
  audio_url: '/audio-output/test-1234.mp3',
  duration_seconds: 2.5,
  model_used: 'xtts-v2'
});

export const submitBatchJob = jest.fn().mockResolvedValue({
  job_id: 'test-batch-123'
});

export const getBatchJobStatus = jest.fn().mockResolvedValue({
  job_id: 'test-batch-123',
  status: 'completed',
  total_items: 2,
  completed_items: 2,
  failed_items: 0,
  items: [
    { id: 'item-1', status: 'completed', file_url: '/audio-output/item1.mp3', error: null },
    { id: 'item-2', status: 'completed', file_url: '/audio-output/item2.mp3', error: null }
  ]
}); 