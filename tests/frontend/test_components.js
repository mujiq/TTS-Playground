import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TTSProvider } from '../../frontend/src/context/TTSContext';
import TextToSpeechPage from '../../frontend/src/pages/TextToSpeechPage';
import Header from '../../frontend/src/components/Header';
import BatchProcessingPage from '../../frontend/src/pages/BatchProcessingPage';
import MonitoringPage from '../../frontend/src/pages/MonitoringPage';
import App from '../../frontend/src/App';
import { MemoryRouter } from 'react-router-dom';

// Import our mock API instead of the real one
jest.mock('../../frontend/src/api/ttsApi', () => require('./mock-api'));

describe('Header Component', () => {
  test('renders all navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Text-to-Speech/i)).toBeInTheDocument();
    expect(screen.getByText(/Batch Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/Monitoring/i)).toBeInTheDocument();
  });
  
  test('highlights current page based on route', () => {
    render(
      <MemoryRouter initialEntries={['/batch']}>
        <Header />
      </MemoryRouter>
    );
    
    const batchTab = screen.getByText(/Batch Processing/i);
    expect(batchTab.closest('button')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('TextToSpeechPage Component', () => {
  beforeEach(() => {
    // Mock API responses
    ttsApi.getSupportedLanguages.mockResolvedValue([
      { code: 'en', name: 'English', dialects: [{ code: 'en-US', name: 'American English' }] }
    ]);
    
    ttsApi.getAvailableAvatars.mockResolvedValue([
      { gender: 'male', dialect: 'en-US', description: 'American English Male Voice' },
      { gender: 'female', dialect: 'en-US', description: 'American English Female Voice' }
    ]);
    
    ttsApi.generateSpeech.mockResolvedValue({
      audio_url: '/audio-output/test.mp3',
      duration_seconds: 2.5
    });
  });
  
  test('renders text input, language and avatar selection', async () => {
    render(
      <MemoryRouter>
        <TTSProvider>
          <TextToSpeechPage />
        </TTSProvider>
      </MemoryRouter>
    );
    
    // Should show loading initially
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    
    // Wait for languages and avatars to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Enter Text/i)).toBeInTheDocument();
    });
    
    // Check for language selection
    expect(screen.getByLabelText(/Language/i)).toBeInTheDocument();
    
    // Check for avatar selection
    expect(screen.getByLabelText(/Avatar/i)).toBeInTheDocument();
    
    // Check for generate button
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });
  
  test('submits text for speech generation', async () => {
    render(
      <MemoryRouter>
        <TTSProvider>
          <TextToSpeechPage />
        </TTSProvider>
      </MemoryRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Enter Text/i)).toBeInTheDocument();
    });
    
    // Fill in the text field
    const textInput = screen.getByLabelText(/Enter Text/i);
    fireEvent.change(textInput, { target: { value: 'This is a test' } });
    
    // Submit the form
    const generateButton = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateButton);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(ttsApi.generateSpeech).toHaveBeenCalledWith(
        'This is a test',
        'en',
        expect.anything()
      );
    });
    
    // Check that audio player appears
    await waitFor(() => {
      expect(screen.getByLabelText(/Audio Player/i)).toBeInTheDocument();
    });
  });
});

describe('BatchProcessingPage Component', () => {
  beforeEach(() => {
    // Mock API responses
    ttsApi.getSupportedLanguages.mockResolvedValue([
      { code: 'en', name: 'English', dialects: [{ code: 'en-US', name: 'American English' }] }
    ]);
    
    ttsApi.getAvailableAvatars.mockResolvedValue([
      { gender: 'male', dialect: 'en-US', description: 'American English Male Voice' },
      { gender: 'female', dialect: 'en-US', description: 'American English Female Voice' }
    ]);
    
    ttsApi.submitBatchJob.mockResolvedValue({
      job_id: 'test-job-123'
    });
    
    ttsApi.getBatchJobStatus.mockResolvedValue({
      job_id: 'test-job-123',
      status: 'completed',
      total_items: 2,
      completed_items: 2,
      failed_items: 0,
      items: [
        { id: 'item-1', status: 'completed', file_url: '/audio-output/item1.mp3', error: null },
        { id: 'item-2', status: 'completed', file_url: '/audio-output/item2.mp3', error: null }
      ]
    });
  });
  
  test('renders batch job form', async () => {
    render(
      <MemoryRouter>
        <TTSProvider>
          <BatchProcessingPage />
        </TTSProvider>
      </MemoryRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/Batch Processing/i)).toBeInTheDocument();
    });
    
    // Check for batch input textarea
    expect(screen.getByLabelText(/batch items/i)).toBeInTheDocument();
    
    // Check for language selection
    expect(screen.getByLabelText(/Language/i)).toBeInTheDocument();
    
    // Check for avatar selection
    expect(screen.getByLabelText(/Avatar/i)).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /Submit Batch/i })).toBeInTheDocument();
  });
  
  test('submits batch job', async () => {
    render(
      <MemoryRouter>
        <TTSProvider>
          <BatchProcessingPage />
        </TTSProvider>
      </MemoryRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/batch items/i)).toBeInTheDocument();
    });
    
    // Fill in the batch items
    const batchInput = screen.getByLabelText(/batch items/i);
    fireEvent.change(batchInput, { target: { value: 'Item 1\nItem 2' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Submit Batch/i });
    fireEvent.click(submitButton);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(ttsApi.submitBatchJob).toHaveBeenCalled();
    });
    
    // Should show job status
    await waitFor(() => {
      expect(screen.getByText(/Job ID/i)).toBeInTheDocument();
    });
  });
});

describe('MonitoringPage Component', () => {
  beforeEach(() => {
    // Mock API responses
    ttsApi.getSystemStats.mockResolvedValue({
      total_nodes: 3,
      active_nodes: 3,
      total_workers: 2,
      active_workers: 2,
      total_gpus: 2,
      active_gpus: 2,
      cluster_resources: {
        cpu_percent: 50,
        memory_percent: 40,
        disk_percent: 30,
        gpu_percent: 60,
        gpu_memory_percent: 45
      },
      workers: [
        {
          worker_id: 'worker-1',
          hostname: 'ray-head',
          resources: {
            cpu_percent: 50,
            memory_percent: 40,
            disk_percent: 30,
            gpu_percent: 60,
            gpu_memory_percent: 45
          },
          tasks_processed: 10
        }
      ]
    });
  });
  
  test('renders system stats', async () => {
    render(
      <MemoryRouter>
        <MonitoringPage />
      </MemoryRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/System Monitoring/i)).toBeInTheDocument();
    });
    
    // Check for system stats
    await waitFor(() => {
      expect(screen.getByText(/Cluster Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/Ray Workers/i)).toBeInTheDocument();
      expect(screen.getByText(/GPU Utilization/i)).toBeInTheDocument();
    });
    
    // Verify API was called
    expect(ttsApi.getSystemStats).toHaveBeenCalled();
  });
});

describe('App Routing', () => {
  test('navigates to different pages', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TTSProvider>
          <App />
        </TTSProvider>
      </MemoryRouter>
    );
    
    // Should start at TTS page
    expect(screen.getByText(/Text-to-Speech/i)).toBeInTheDocument();
    
    // Navigate to Batch Processing
    const batchTab = screen.getByText(/Batch Processing/i);
    fireEvent.click(batchTab);
    
    // Should now show Batch Processing page
    expect(screen.getByText(/Batch Processing/i)).toBeInTheDocument();
    
    // Navigate to Monitoring
    const monitoringTab = screen.getByText(/Monitoring/i);
    fireEvent.click(monitoringTab);
    
    // Should now show Monitoring page
    expect(screen.getByText(/System Monitoring/i)).toBeInTheDocument();
  });
}); 