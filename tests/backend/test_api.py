#!/usr/bin/env python3

import os
import requests
import time
import json
import unittest
import sys

# The base URL for API requests (use the host where Docker containers are running)
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost/api')

# Set to True to print more debug information
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'

class TestTTSAPI(unittest.TestCase):
    """Test suite for Text-to-Speech API endpoints"""
    
    def setUp(self):
        """Setup before each test - check API is accessible"""
        # Wait for API to be available
        max_retries = 5
        retry_delay = 2  # seconds
        
        for i in range(max_retries):
            try:
                response = requests.get(f"{API_BASE_URL}")
                if response.status_code < 500:  # Any response that's not a server error
                    break
            except requests.RequestException:
                pass
            
            print(f"Waiting for API to be available (attempt {i+1}/{max_retries})...")
            time.sleep(retry_delay)
    
    def test_get_languages(self):
        """Test getting supported languages"""
        if DEBUG:
            print(f"Testing API endpoint: {API_BASE_URL}/languages")
        
        try:
            response = requests.get(f"{API_BASE_URL}/languages")
            self.assertEqual(response.status_code, 200)
            languages = response.json()
            self.assertIsInstance(languages, list)
            self.assertGreater(len(languages), 0)
            
            # Check language structure
            first_language = languages[0]
            self.assertIn('code', first_language)
            self.assertIn('name', first_language)
            
            # Check if English language exists
            english = next((lang for lang in languages if lang['code'] == 'en'), None)
            self.assertIsNotNone(english)
            self.assertEqual(english['name'], 'English')
            
            print(f"Found {len(languages)} languages")
        except requests.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        except Exception as e:
            self.fail(f"Unexpected error: {str(e)}")
    
    def test_get_avatars(self):
        """Test getting available avatars"""
        if DEBUG:
            print(f"Testing API endpoint: {API_BASE_URL}/avatars")
        
        try:
            response = requests.get(f"{API_BASE_URL}/avatars")
            self.assertEqual(response.status_code, 200)
            avatars = response.json()
            self.assertIsInstance(avatars, list)
            self.assertGreater(len(avatars), 0)
            
            # Check avatar structure
            first_avatar = avatars[0]
            self.assertIn('gender', first_avatar)
            self.assertIn('dialect', first_avatar)
            self.assertIn('description', first_avatar)
            
            print(f"Found {len(avatars)} avatars")
        except requests.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        except Exception as e:
            self.fail(f"Unexpected error: {str(e)}")
    
    def test_get_models(self):
        """Test getting available TTS models"""
        if DEBUG:
            print(f"Testing API endpoint: {API_BASE_URL}/models")
        
        try:
            response = requests.get(f"{API_BASE_URL}/models")
            self.assertEqual(response.status_code, 200)
            models = response.json()
            self.assertIsInstance(models, list)
            self.assertGreater(len(models), 0)
            
            # Check model structure
            first_model = models[0]
            self.assertIn('id', first_model)
            self.assertIn('name', first_model)
            self.assertIn('description', first_model)
            
            print(f"Found {len(models)} models")
        except requests.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        except Exception as e:
            self.fail(f"Unexpected error: {str(e)}")
    
    def test_generate_speech(self):
        """Test generating speech from text"""
        if DEBUG:
            print(f"Testing API endpoint: {API_BASE_URL}/tts")
        
        payload = {
            "text": "This is a test of the text-to-speech API.",
            "language": "en",
            "avatar": {
                "gender": "female",
                "dialect": "en-US"
            }
        }
        
        try:
            response = requests.post(f"{API_BASE_URL}/tts", json=payload)
            self.assertEqual(response.status_code, 200)
            result = response.json()
            
            # Check response structure
            self.assertIn('audio_url', result)
            self.assertIn('duration_seconds', result)
            
            # Check if audio file exists
            audio_url = result['audio_url']
            audio_response = requests.get(f"http://localhost{audio_url}")
            self.assertEqual(audio_response.status_code, 200)
            self.assertEqual(audio_response.headers['Content-Type'], 'audio/mpeg')
            
            print(f"Generated speech file: {audio_url}")
        except requests.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        except Exception as e:
            self.fail(f"Unexpected error: {str(e)}")
    
    def test_batch_processing(self):
        """Test batch processing of TTS requests"""
        if DEBUG:
            print(f"Testing API endpoint: {API_BASE_URL}/batch-tts")
        
        payload = {
            "items": [
                {
                    "id": "test-item-1",
                    "text": "This is the first test item.",
                    "language": "en",
                    "avatar": {
                        "gender": "male",
                        "dialect": "en-US"
                    }
                },
                {
                    "id": "test-item-2",
                    "text": "This is the second test item.",
                    "language": "en",
                    "avatar": {
                        "gender": "female",
                        "dialect": "en-GB"
                    }
                }
            ]
        }
        
        try:
            # Submit batch job
            response = requests.post(f"{API_BASE_URL}/batch-tts", json=payload)
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn('job_id', result)
            
            job_id = result['job_id']
            print(f"Submitted batch job with ID: {job_id}")
            
            # Poll for job completion (with timeout)
            max_tries = 20
            tries = 0
            job_completed = False
            
            while tries < max_tries and not job_completed:
                status_response = requests.get(f"{API_BASE_URL}/batch-tts/{job_id}/status")
                self.assertEqual(status_response.status_code, 200)
                status = status_response.json()
                
                if status['status'] in ['completed', 'failed']:
                    job_completed = True
                else:
                    tries += 1
                    print(f"Job status: {status['status']} (attempt {tries}/{max_tries})")
                    time.sleep(2)
            
            self.assertTrue(job_completed, "Batch job did not complete within the timeout period")
            
            # Check job results
            status_response = requests.get(f"{API_BASE_URL}/batch-tts/{job_id}/status")
            self.assertEqual(status_response.status_code, 200)
            final_status = status_response.json()
            
            self.assertEqual(final_status['status'], 'completed')
            self.assertEqual(final_status['total_items'], 2)
            self.assertEqual(final_status['completed_items'], 2)
            
            # Check individual items
            items = final_status['items']
            self.assertEqual(len(items), 2)
            
            for item in items:
                self.assertEqual(item['status'], 'completed')
                self.assertIsNotNone(item['file_url'])
                
                # Check if audio file exists
                audio_response = requests.get(f"http://localhost{item['file_url']}")
                self.assertEqual(audio_response.status_code, 200)
                self.assertEqual(audio_response.headers['Content-Type'], 'audio/mpeg')
            
            print(f"Batch job completed successfully, all items processed")
        except requests.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        except Exception as e:
            self.fail(f"Unexpected error: {str(e)}")
    
    def test_system_stats(self):
        """Test getting system statistics"""
        if DEBUG:
            print(f"Testing API endpoint: {API_BASE_URL}/system-stats")
        
        try:
            response = requests.get(f"{API_BASE_URL}/system-stats")
            self.assertEqual(response.status_code, 200)
            stats = response.json()
            
            # Check stats structure
            self.assertIn('total_nodes', stats)
            self.assertIn('active_nodes', stats)
            self.assertIn('total_workers', stats)
            self.assertIn('active_workers', stats)
            self.assertIn('total_gpus', stats)
            self.assertIn('active_gpus', stats)
            self.assertIn('cluster_resources', stats)
            
            # Check cluster resources
            resources = stats['cluster_resources']
            self.assertIn('cpu_percent', resources)
            self.assertIn('memory_percent', resources)
            self.assertIn('disk_percent', resources)
            
            print(f"System stats: {stats['active_nodes']} nodes, {stats['active_workers']} workers, {stats['active_gpus']} GPUs")
        except requests.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        except Exception as e:
            self.fail(f"Unexpected error: {str(e)}")

if __name__ == '__main__':
    print(f"Testing API at {API_BASE_URL}")
    unittest.main(argv=['first-arg-is-ignored'], exit=False) 