const puppeteer = require('puppeteer');

/**
 * End-to-end tests for the Text-to-Speech frontend
 * 
 * These tests verify that the frontend app works correctly in a real browser
 * with actual API interactions (not mocked).
 */

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost';
const TIMEOUT = 30000; // 30 seconds timeout

// Helper to create a browser and page
async function setupBrowser() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);
  
  return { browser, page };
}

describe('Text-to-Speech App E2E Tests', () => {
  let browser, page;
  
  beforeAll(async () => {
    ({ browser, page } = await setupBrowser());
  });
  
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
  
  test('loads the home page', async () => {
    await page.goto(APP_URL);
    await page.waitForSelector('header');
    
    // Check the title
    const title = await page.title();
    expect(title).toContain('Text-to-Speech');
    
    // Check the header
    const headerText = await page.$eval('header', el => el.textContent);
    expect(headerText).toContain('Text-to-Speech');
  }, TIMEOUT);
  
  test('TTS page loads language and avatar selections', async () => {
    await page.goto(APP_URL);
    
    // Wait for language selection to load
    await page.waitForSelector('[data-testid="language-select"]');
    
    // Check that language options loaded
    const languageOptions = await page.evaluate(() => {
      const select = document.querySelector('[data-testid="language-select"]');
      return select.options.length;
    });
    
    expect(languageOptions).toBeGreaterThan(0);
    
    // Wait for avatar selection to load
    await page.waitForSelector('[data-testid="avatar-select"]');
    
    // Check that avatar options loaded
    const avatarOptions = await page.evaluate(() => {
      const select = document.querySelector('[data-testid="avatar-select"]');
      return select.options.length;
    });
    
    expect(avatarOptions).toBeGreaterThan(0);
  }, TIMEOUT);
  
  test('can generate speech from text', async () => {
    await page.goto(APP_URL);
    
    // Wait for the text input to appear
    await page.waitForSelector('textarea[name="text"]');
    
    // Type some text
    await page.type('textarea[name="text"]', 'This is a test of the text to speech system.');
    
    // Click the generate button
    await page.click('[data-testid="generate-button"]');
    
    // Wait for the audio player to appear
    await page.waitForSelector('audio');
    
    // Check that the audio player has a source
    const audioSrc = await page.$eval('audio', el => el.src);
    expect(audioSrc).toContain('/audio-output/');
  }, TIMEOUT);
  
  test('can navigate to batch processing page', async () => {
    await page.goto(APP_URL);
    
    // Click on Batch Processing tab
    await page.waitForSelector('[data-testid="batch-tab"]');
    await page.click('[data-testid="batch-tab"]');
    
    // Check that we're on the batch page
    await page.waitForSelector('[data-testid="batch-form"]');
    
    // Check title
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('Batch Processing');
  }, TIMEOUT);
  
  test('can submit a batch job', async () => {
    await page.goto(APP_URL + '/batch');
    
    // Wait for the batch input to appear
    await page.waitForSelector('textarea[name="batchItems"]');
    
    // Type some batch items
    await page.type('textarea[name="batchItems"]', 'Line 1\nLine 2\nLine 3');
    
    // Click the submit button
    await page.click('[data-testid="submit-batch-button"]');
    
    // Wait for the job status to appear
    await page.waitForSelector('[data-testid="job-status"]', { timeout: TIMEOUT });
    
    // Check that we got a job ID
    const jobStatus = await page.$eval('[data-testid="job-status"]', el => el.textContent);
    expect(jobStatus).toContain('Job ID');
  }, TIMEOUT);
  
  test('can navigate to monitoring page', async () => {
    await page.goto(APP_URL);
    
    // Click on Monitoring tab
    await page.waitForSelector('[data-testid="monitoring-tab"]');
    await page.click('[data-testid="monitoring-tab"]');
    
    // Check that we're on the monitoring page
    await page.waitForSelector('[data-testid="monitoring-dashboard"]');
    
    // Check title
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('System Monitoring');
    
    // Check for monitoring components
    const dashboardText = await page.$eval('[data-testid="monitoring-dashboard"]', el => el.textContent);
    expect(dashboardText).toContain('Cluster Overview');
    expect(dashboardText).toContain('GPU');
  }, TIMEOUT);
  
  test('check all links in the header', async () => {
    await page.goto(APP_URL);
    
    // Get all links in the header
    const headerLinks = await page.$$eval('header a', links => links.map(link => ({
      text: link.textContent.trim(),
      href: link.getAttribute('href')
    })));
    
    // Check each link works
    for (const link of headerLinks) {
      await page.goto(APP_URL + link.href);
      
      // Wait for page to load
      await page.waitForSelector('main');
      
      // Check that the page loaded
      const content = await page.$eval('main', el => el.textContent);
      expect(content.length).toBeGreaterThan(0);
    }
  }, TIMEOUT);
}); 