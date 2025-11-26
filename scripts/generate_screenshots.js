const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'assets', 'images');
const SCREENSHOTS = [
  { name: 'screenshot-1.png', description: 'Initial state with default servers' },
  { name: 'screenshot-2.png', description: 'Simulation running with traffic' },
  { name: 'screenshot-3.png', description: 'Different algorithm selected' }
];

// Ensure screenshots directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

// Start HTTP server
function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['http-server', '-p', PORT.toString(), '--silent'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;

    server.stdout.on('data', (data) => {
      console.log(`Server: ${data.toString().trim()}`);
      if (!started) {
        started = true;
        setTimeout(() => resolve(server), 2000); // Wait 2s for server to be ready
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data.toString().trim()}`);
    });

    server.on('error', (error) => {
      reject(error);
    });

    // Fallback in case no stdout
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(server);
      }
    }, 3000);
  });
}

// Take screenshots
async function generateScreenshots() {
  let server = null;
  let browser = null;

  try {
    console.log('Starting screenshot generation...\n');

    // Ensure directory exists
    ensureDirectoryExists(SCREENSHOTS_DIR);

    // Start HTTP server
    console.log(`Starting HTTP server on port ${PORT}...`);
    server = await startServer();
    console.log('✓ Server started\n');

    // Launch browser
    console.log('Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✓ Browser launched\n');

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    // Screenshot 1: Initial state
    console.log(`Taking screenshot 1/${SCREENSHOTS.length}: ${SCREENSHOTS[0].description}...`);
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, SCREENSHOTS[0].name),
      fullPage: false
    });
    console.log(`✓ Saved: ${SCREENSHOTS[0].name}\n`);

    // Screenshot 2: Start simulation
    console.log(`Taking screenshot 2/${SCREENSHOTS.length}: ${SCREENSHOTS[1].description}...`);
    
    // Try to click start button if it exists
    try {
      const startButton = await page.$('#btn-start');
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(2000); // Wait for traffic to appear
      }
    } catch (e) {
      console.log('Note: Could not interact with start button, taking static screenshot');
    }
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, SCREENSHOTS[1].name),
      fullPage: false
    });
    console.log(`✓ Saved: ${SCREENSHOTS[1].name}\n`);

    // Screenshot 3: Different algorithm
    console.log(`Taking screenshot 3/${SCREENSHOTS.length}: ${SCREENSHOTS[2].description}...`);
    
    // Try to change algorithm if dropdown exists
    // NOTE: Algorithm value 'least-connections' must match the option values in index.html
    // Update this value if the application's algorithm options change
    try {
      const algoSelect = await page.$('#algorithm-select');
      if (algoSelect) {
        await page.select('#algorithm-select', 'least-connections');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Note: Could not interact with algorithm selector, taking static screenshot');
    }
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, SCREENSHOTS[2].name),
      fullPage: false
    });
    console.log(`✓ Saved: ${SCREENSHOTS[2].name}\n`);

    console.log('✅ All screenshots generated successfully!');
    console.log(`Location: ${SCREENSHOTS_DIR}\n`);

  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
      console.log('✓ Browser closed');
    }
    if (server) {
      server.kill();
      console.log('✓ Server stopped');
    }
  }
}

// Run
generateScreenshots().then(() => {
  console.log('\nScreenshot generation complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
