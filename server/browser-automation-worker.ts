import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { v4 as uuidv4 } from 'uuid';
import ws from 'ws';

// Create Express server
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Store active browser instances
const browsers: Map<string, Browser> = new Map();
const pages: Map<string, Page> = new Map();

// WebSocket server for real-time communication
const wsServer = new ws.Server({ noServer: true });
const clients: Map<string, ws> = new Map();

// Configure Puppeteer launch options for containerized environment
const puppeteerOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
  ],
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
};

// Endpoint to start a new browser session
app.post('/browser/sessions', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || uuidv4();
    
    // Check if a browser already exists for this session
    if (browsers.has(sessionId)) {
      return res.json({
        success: true,
        sessionId,
        message: 'Browser session already active'
      });
    }
    
    // Launch a new browser
    const browser = await puppeteer.launch(puppeteerOptions);
    browsers.set(sessionId, browser);
    
    // Create a new page
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    pages.set(sessionId, page);
    
    // Set up page event listeners
    setupPageListeners(page, sessionId);
    
    res.json({
      success: true,
      sessionId,
      message: 'Browser session started'
    });
  } catch (error) {
    console.error('Error starting browser session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to navigate to a URL
app.post('/browser/sessions/:sessionId/navigate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    const page = pages.get(sessionId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Browser session not found'
      });
    }
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Get page metadata
    const title = await page.title();
    const currentUrl = page.url();
    
    res.json({
      success: true,
      title,
      url: currentUrl
    });
  } catch (error) {
    console.error('Error navigating to URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to take a screenshot
app.post('/browser/sessions/:sessionId/screenshot', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { fullPage = false, selector } = req.body;
    
    const page = pages.get(sessionId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Browser session not found'
      });
    }
    
    let screenshot;
    if (selector) {
      // Take screenshot of a specific element
      const element = await page.$(selector);
      if (!element) {
        return res.status(404).json({
          success: false,
          error: `Element with selector "${selector}" not found`
        });
      }
      screenshot = await element.screenshot({ type: 'jpeg', quality: 80 });
    } else {
      // Take screenshot of the entire page or viewport
      screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage
      });
    }
    
    res.json({
      success: true,
      screenshot: screenshot.toString('base64')
    });
  } catch (error) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to execute an action
app.post('/browser/sessions/:sessionId/execute', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { actionType, selector, value, coordinates, waitTime } = req.body;
    
    const page = pages.get(sessionId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Browser session not found'
      });
    }
    
    // Wait for the specified time before execution if provided
    if (waitTime && waitTime > 0) {
      // Using setTimeout with Promise for waiting instead of native waitForTimeout
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    let result;
    switch (actionType) {
      case 'click':
        if (selector) {
          await page.waitForSelector(selector, { timeout: 5000 });
          await page.click(selector);
        } else if (coordinates) {
          await page.mouse.click(coordinates.x, coordinates.y);
        } else {
          throw new Error('Either selector or coordinates are required for click action');
        }
        result = { success: true, action: 'click' };
        break;
        
      case 'type':
        if (!selector) {
          throw new Error('Selector is required for type action');
        }
        if (value === undefined) {
          throw new Error('Value is required for type action');
        }
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.type(selector, value);
        result = { success: true, action: 'type' };
        break;
        
      case 'select':
        if (!selector) {
          throw new Error('Selector is required for select action');
        }
        if (value === undefined) {
          throw new Error('Value is required for select action');
        }
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.select(selector, value);
        result = { success: true, action: 'select' };
        break;
        
      case 'wait':
        // Using setTimeout with Promise for waiting instead of native waitForTimeout
        await new Promise(resolve => setTimeout(resolve, value || 1000));
        result = { success: true, action: 'wait' };
        break;
        
      case 'extract':
        if (!selector) {
          throw new Error('Selector is required for extract action');
        }
        await page.waitForSelector(selector, { timeout: 5000 });
        const extractedText = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          return element ? element.textContent : null;
        }, selector);
        result = { success: true, action: 'extract', data: extractedText };
        break;
        
      case 'evaluate':
        if (!value) {
          throw new Error('JavaScript code is required for evaluate action');
        }
        const evaluationResult = await page.evaluate(value);
        result = { success: true, action: 'evaluate', data: evaluationResult };
        break;
        
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to extract data from the page
app.post('/browser/sessions/:sessionId/extract', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selectors } = req.body;
    
    if (!selectors || Object.keys(selectors).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Selectors object is required'
      });
    }
    
    const page = pages.get(sessionId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Browser session not found'
      });
    }
    
    // Extract data for each selector
    const result: Record<string, string | null> = {};
    for (const [name, selector] of Object.entries(selectors)) {
      result[name] = await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.textContent?.trim() || null : null;
      }, selector);
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error extracting data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to run a sequence of actions
app.post('/browser/sessions/:sessionId/sequence', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { steps } = req.body;
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Steps array is required'
      });
    }
    
    const page = pages.get(sessionId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Browser session not found'
      });
    }
    
    // Execute each step in sequence
    const results = [];
    for (const step of steps) {
      try {
        // Wait for any specified delay before the step
        if (step.waitBefore && step.waitBefore > 0) {
          // Using setTimeout with Promise for waiting instead of native waitForTimeout
          await new Promise(resolve => setTimeout(resolve, step.waitBefore));
        }
        
        // Execute the step based on its action type
        let stepResult;
        switch (step.actionType) {
          case 'navigation':
            if (step.url) {
              await page.goto(step.url, { waitUntil: 'networkidle2' });
              stepResult = {
                success: true,
                action: 'navigation',
                url: page.url()
              };
            } else {
              throw new Error('URL is required for navigation action');
            }
            break;
            
          case 'click':
            if (step.selector) {
              await page.waitForSelector(step.selector, { timeout: 5000 });
              await page.click(step.selector);
              stepResult = {
                success: true,
                action: 'click',
                selector: step.selector
              };
            } else {
              throw new Error('Selector is required for click action');
            }
            break;
            
          case 'input':
            if (step.selector && step.value !== undefined) {
              await page.waitForSelector(step.selector, { timeout: 5000 });
              await page.type(step.selector, step.value);
              stepResult = {
                success: true,
                action: 'input',
                selector: step.selector
              };
            } else {
              throw new Error('Selector and value are required for input action');
            }
            break;
            
          case 'wait':
            // Using setTimeout with Promise for waiting instead of native waitForTimeout
            await new Promise(resolve => setTimeout(resolve, step.value || 1000));
            stepResult = {
              success: true,
              action: 'wait',
              duration: step.value || 1000
            };
            break;
            
          case 'extract':
            if (step.selector) {
              await page.waitForSelector(step.selector, { timeout: 5000 });
              const text = await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                return element ? element.textContent : null;
              }, step.selector);
              stepResult = {
                success: true,
                action: 'extract',
                selector: step.selector,
                data: text
              };
            } else {
              throw new Error('Selector is required for extract action');
            }
            break;
            
          case 'screenshot':
            const screenshot = await page.screenshot({
              type: 'jpeg',
              quality: 80,
              fullPage: step.fullPage || false
            });
            stepResult = {
              success: true,
              action: 'screenshot',
              data: screenshot.toString('base64')
            };
            break;
            
          default:
            throw new Error(`Unsupported action type: ${step.actionType}`);
        }
        
        // Wait for any specified delay after the step
        if (step.waitAfter && step.waitAfter > 0) {
          // Using setTimeout with Promise for waiting instead of native waitForTimeout
          await new Promise(resolve => setTimeout(resolve, step.waitAfter));
        }
        
        results.push({
          stepId: step.id,
          order: step.order,
          ...stepResult
        });
      } catch (error) {
        results.push({
          stepId: step.id,
          order: step.order,
          success: false,
          error: error.message
        });
        
        // If the step is marked as critical, stop the sequence on failure
        if (step.critical) {
          break;
        }
      }
    }
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error running sequence:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to close a browser session
app.delete('/browser/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const browser = browsers.get(sessionId);
    if (!browser) {
      return res.status(404).json({
        success: false,
        error: 'Browser session not found'
      });
    }
    
    // Close the browser
    await browser.close();
    browsers.delete(sessionId);
    pages.delete(sessionId);
    
    res.json({
      success: true,
      message: 'Browser session closed'
    });
  } catch (error) {
    console.error('Error closing browser session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to set up page event listeners
function setupPageListeners(page: Page, sessionId: string) {
  // Monitor page navigation
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      broadcastEvent(sessionId, {
        type: 'navigation',
        url: frame.url(),
        title: await page.title(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Monitor console logs
  page.on('console', (message) => {
    broadcastEvent(sessionId, {
      type: 'console',
      level: message.type(),
      text: message.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Monitor errors
  page.on('error', (error) => {
    broadcastEvent(sessionId, {
      type: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  // Inject recorder script to monitor user interactions
  page.evaluateOnNewDocument(`
    (function() {
      // Track clicks
      document.addEventListener('click', function(event) {
        const target = event.target;
        const selector = getSelector(target);
        
        window.recordAction && window.recordAction({
          type: 'click',
          target: selector,
          url: window.location.href,
          value: target.textContent?.trim() || '',
          timestamp: new Date().toISOString(),
          metadata: {
            tagName: target.tagName,
            id: target.id,
            className: target.className,
          }
        });
      }, true);
      
      // Track form inputs
      document.addEventListener('change', function(event) {
        const target = event.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          const selector = getSelector(target);
          let value = target.value;
          
          // Mask sensitive values
          if (target.type === 'password' || target.name?.includes('password') || target.id?.includes('password')) {
            value = '********';
          }
          
          window.recordAction && window.recordAction({
            type: 'input',
            target: selector,
            url: window.location.href,
            value: value,
            timestamp: new Date().toISOString(),
            metadata: {
              tagName: target.tagName,
              type: target.type,
              name: target.name,
              id: target.id,
            }
          });
        }
      }, true);
      
      // Utility function to get a unique selector for an element
      function getSelector(element) {
        if (!element) return '';
        if (element.id) return '#' + element.id;
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
          const classes = element.className.split(/\\s+/).filter(Boolean);
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        return selector;
      }
    })();
  `);
}

// Helper function to broadcast events to WebSocket clients
function broadcastEvent(sessionId: string, event: any) {
  const client = clients.get(sessionId);
  if (client && client.readyState === ws.OPEN) {
    client.send(JSON.stringify(event));
  }
}

// Set up WebSocket connections
const server = app.listen(process.env.PORT || 3001, () => {
  console.log(`Browser automation worker running on port ${process.env.PORT || 3001}`);
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    const url = new URL(request.url, 'http://localhost');
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      socket.destroy();
      return;
    }
    
    clients.set(sessionId, ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle any incoming messages from clients
        console.log(`Received message from session ${sessionId}:`, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(sessionId);
    });
  });
});

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close all active browsers
  for (const [sessionId, browser] of browsers.entries()) {
    try {
      await browser.close();
      console.log(`Closed browser session ${sessionId}`);
    } catch (error) {
      console.error(`Error closing browser session ${sessionId}:`, error);
    }
  }
  
  // Close the server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});