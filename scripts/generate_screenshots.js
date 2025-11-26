const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('http-server/lib/core/index');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverHandler = handler.createServer({
      root: path.join(__dirname, '..'),
      cache: -1,
      showDir: true,
      autoIndex: true
    });

    const server = http.createServer(serverHandler);

    server.listen(PORT, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Server started on http://localhost:${PORT}`);
        resolve(server);
      }
    });

    server.on('error', reject);
  });
}

async function generateScreenshots() {
  let server = null;
  let browser = null;

  try {
    // Start the server
    server = await startServer();

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 700 });

    // Navigate to the page
    console.log('Navigating to http://localhost:8080/index.html');
    await page.goto(`http://localhost:${PORT}/index.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any animations to complete
    await page.waitForTimeout(2000);

    // Screenshot 1: Initial state
    console.log('Capturing screenshot 1...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'screenshot-1.png'),
      fullPage: false
    });

    // Screenshot 2: With different state (TODO: customize selectors for richer interactions)
    // For now, just wait a bit more and capture another shot
    console.log('Capturing screenshot 2...');
    await page.waitForTimeout(1000);
    
    // TODO: Add custom interactions here to capture different UI states
    // Example: await page.click('#btn-start');
    // Example: await page.select('#algorithm-select', 'random');
    
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'screenshot-2.png'),
      fullPage: false
    });

    // Screenshot 3: Another state
    console.log('Capturing screenshot 3...');
    await page.waitForTimeout(1000);
    
    // TODO: Add more custom interactions here to capture different UI states
    // Example: await page.click('#btn-add-server');
    
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'screenshot-3.png'),
      fullPage: false
    });

    console.log('Screenshots generated successfully!');
  } catch (error) {
    console.error('Error generating screenshots:', error);
    process.exit(1);
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
    if (server) {
      server.close(() => {
        console.log('Server closed');
      });
    }
  }
}

generateScreenshots();
