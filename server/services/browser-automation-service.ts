import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer-core';
import path from 'path';
import { browserObserverService } from './browser-observer-service';
import { workflowProgressService } from './workflow-progress-service';
import type { 
  BrowserSequence, 
  BrowserSequenceStep,
  WorkflowExecution,
  WorkflowStepExecution
} from '@shared/schema';

/**
 * BrowserAutomationService
 * 
 * Service responsible for running real browser automation tasks
 * using Puppeteer in a containerized environment.
 */
export class BrowserAutomationService {
  private browsers: Map<string, Browser> = new Map();
  
  /**
   * Launch a browser instance with a specific session ID
   * @param sessionId Unique session identifier
   * @returns The browser page object
   */
  async launchBrowser(sessionId: string, retryCount = 0): Promise<Page> {
    const MAX_RETRIES = 2;
    
    try {
      // Check if a browser instance already exists for this session
      if (this.browsers.has(sessionId)) {
        const existingBrowser = this.browsers.get(sessionId)!;
        const pages = await existingBrowser.pages();
        if (pages.length > 0) {
          return pages[0];
        }
        const page = await existingBrowser.newPage();
        return page;
      }

      // Configuration for running in Docker container with additional timeout settings
      const launchOptions: LaunchOptions = {
        headless: true,
        timeout: 30000, // 30 second timeout for browser launch
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=site-per-process',
          '--disable-extensions',
          '--disable-accelerated-2d-canvas',
          '--disable-accelerated-jpeg-decoding',
          '--disable-accelerated-mjpeg-decode',
          '--disable-accelerated-video-decode',
          '--disable-app-list-dismiss-on-blur',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-features=TranslateUI',
          '--disable-features=BlinkGenPropertyTrees',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-offer-store-unmasked-wallet-cards',
          '--disable-popup-blocking',
          '--disable-print-preview',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-speech-api',
          '--disable-sync',
          '--hide-scrollbars',
          '--ignore-certificate-errors',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          '--no-pings',
          '--no-zygote',
          '--password-store=basic',
          '--use-gl=swiftshader',
          '--window-size=1920,1080',
          '--enable-features=NetworkService',
          '--allow-running-insecure-content',
          '--enable-automation',
          '--autoplay-policy=user-gesture-required',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-infobars',
          '--js-flags=--expose-gc',
          '--disable-features=ScriptStreaming',
          '--disable-features=UserActivationV2',
          '--disable-features=LazyFrameLoading',
          '--disable-features=BlinkGenPropertyTrees',
        ],
        executablePath: '/nix/store/abrj4jhpf3l8j2l62lnla1mca9h70f2s-chromium-120.0.6099.129/bin/chromium',
      };
      
      // Add ignoreHTTPSErrors for puppeteer-core
      const browser = await puppeteer.launch(launchOptions);

      // Store the browser instance for this session
      this.browsers.set(sessionId, browser);
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set up the page for automation
      await this.setupPageForAutomation(page, sessionId);
      
      return page;
    } catch (error) {
      console.error(`Error launching browser (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // Add retry logic with exponential backoff for resilience
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying browser launch for session ${sessionId}...`);
        // Exponential backoff: wait longer between retries (500ms, 1000ms)
        const backoffTime = 500 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.launchBrowser(sessionId, retryCount + 1);
      }
      
      // Enhanced error reporting with more context for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to launch browser after ${retryCount + 1} attempts: ${errorMessage}. Please check if the browser service is running properly.`);
    }
  }

  /**
   * Set up page with listeners and configuration for automation
   * @param page Browser page object
   * @param sessionId Unique session identifier
   */
  private async setupPageForAutomation(page: Page, sessionId: string): Promise<void> {
    // Configure viewport for consistent rendering
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent to a standard one
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
    
    // Set up page event listeners to record actions
    await page.exposeFunction('recordAction', async (action: any) => {
      await browserObserverService.recordAction({
        userId: 0, // Will be updated by the API when sent
        sessionId,
        actionType: action.type,
        targetElement: action.target,
        url: action.url,
        valueOrText: action.value,
        metadata: action.metadata || {},
      });
    });

    // Inject recorder script to monitor user interactions
    await page.evaluateOnNewDocument(`
      (function() {
        // Track clicks
        document.addEventListener('click', function(event) {
          const target = event.target;
          const selector = getSelector(target);
          
          window.recordAction({
            type: 'click',
            target: selector,
            url: window.location.href,
            value: target.textContent?.trim() || '',
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
            
            window.recordAction({
              type: 'input',
              target: selector,
              url: window.location.href,
              value: value,
              metadata: {
                tagName: target.tagName,
                type: target.type,
                name: target.name,
                id: target.id,
              }
            });
          }
        }, true);
        
        // Track form submissions
        document.addEventListener('submit', function(event) {
          const form = event.target;
          const selector = getSelector(form);
          
          window.recordAction({
            type: 'submit',
            target: selector,
            url: window.location.href,
            value: '',
            metadata: {
              action: form.action,
              method: form.method,
              id: form.id,
            }
          });
        }, true);
        
        // Track navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
          const result = originalPushState.apply(this, arguments);
          window.recordAction({
            type: 'navigation',
            target: 'history.pushState',
            url: window.location.href,
            value: arguments[2], // The URL argument
            metadata: {
              state: JSON.stringify(arguments[0]),
              title: arguments[1],
            }
          });
          
          return result;
        };
        
        history.replaceState = function() {
          const result = originalReplaceState.apply(this, arguments);
          window.recordAction({
            type: 'navigation',
            target: 'history.replaceState',
            url: window.location.href,
            value: arguments[2], // The URL argument
            metadata: {
              state: JSON.stringify(arguments[0]),
              title: arguments[1],
            }
          });
          
          return result;
        };
        
        // Utility function to get a unique selector for an element
        function getSelector(element) {
          if (!element) return '';
          if (element.id) return '#' + element.id;
          
          // Try to build a unique selector using classes, attributes and position
          let selector = element.tagName.toLowerCase();
          
          if (element.className) {
            const classes = element.className.split(/\\s+/).filter(Boolean);
            if (classes.length > 0) {
              selector += '.' + classes.join('.');
            }
          }
          
          // Add attributes like name, type, etc. if they exist
          if (element.name) selector += '[name="' + element.name + '"]';
          if (element.type) selector += '[type="' + element.type + '"]';
          
          // Add position index if there are multiple elements with the same selector
          if (element.parentNode) {
            const siblings = Array.from(element.parentNode.children);
            const sameTagSiblings = siblings.filter(el => el.tagName === element.tagName);
            if (sameTagSiblings.length > 1) {
              const index = sameTagSiblings.indexOf(element);
              selector += ':nth-of-type(' + (index + 1) + ')';
            }
          }
          
          return selector;
        }
      })();
    `);
    
    // Monitor page navigation
    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame()) {
        await browserObserverService.recordAction({
          userId: 0,
          sessionId,
          actionType: 'navigation',
          targetElement: 'page',
          url: frame.url(),
          valueOrText: frame.url(),
          metadata: {
            title: await page.title(),
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
  }

  /**
   * Close a browser session
   * @param sessionId Session to close
   */
  async closeBrowser(sessionId: string): Promise<void> {
    try {
      const browser = this.browsers.get(sessionId);
      if (browser) {
        await browser.close();
        this.browsers.delete(sessionId);
      }
    } catch (error) {
      console.error(`Error closing browser session ${sessionId}:`, error);
    }
  }

  /**
   * Execute a sequence of browser actions
   * @param sequence The browser sequence to run
   * @param steps The steps in the sequence
   * @returns Results of the execution
   */
  async runSequence(
    sequence: BrowserSequence, 
    steps: BrowserSequenceStep[], 
    userId?: number,
    browserSessionId?: string
  ): Promise<any> {
    if (!steps || steps.length === 0) {
      throw new Error('No steps provided for the sequence');
    }
    
    // Generate a unique session ID for this run
    const runSessionId = browserSessionId || `sequence-run-${sequence.id}-${Date.now()}`;
    let page: Page | null = null;
    let workflowExecution: WorkflowExecution | null = null;
    const startTime = Date.now();
    
    try {
      // Create a workflow execution record to track progress
      workflowExecution = await workflowProgressService.startExecution({
        sequenceId: sequence.id,
        userId: userId || null,
        browserSessionId: runSessionId,
        status: 'running',
        startedAt: new Date(),
        progress: 0,
        currentStepOrder: 1,
      });
      
      // Launch a new browser for this sequence
      page = await this.launchBrowser(runSessionId);
      
      // Create step execution records
      const stepExecutions: WorkflowStepExecution[] = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepExecution = await workflowProgressService.createStepExecution({
          executionId: workflowExecution.id,
          stepId: step.id,
          order: i + 1,
          actionType: step.actionType,
          targetElement: step.targetElement || '',
          status: i === 0 ? 'running' : 'pending',
          startedAt: i === 0 ? new Date() : null,
          completedAt: null,
          error: null,
          retries: 0,
          duration: null,
          screenshot: null,
        });
        stepExecutions.push(stepExecution);
      }
      
      // Execute each step in order with progress tracking
      const results = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepExecution = stepExecutions[i];
        const stepStartTime = Date.now();
        
        try {
          // Update workflow execution to track current step
          await workflowProgressService.updateExecution(workflowExecution.id, {
            currentStepId: stepExecution.id,
            currentStepOrder: i + 1,
            progress: Math.round((i / steps.length) * 100),
          });
          
          // Update step to running status
          if (i > 0) {
            await workflowProgressService.updateStepStatus(
              workflowExecution.id,
              stepExecution.id,
              'running',
              { startedAt: new Date() }
            );
          }
          
          // Execute the step
          const result = await this.executeStep(page, step);
          results.push(result);
          
          // Take screenshot if needed
          let screenshot = null;
          if (step.takeScreenshot) {
            const screenshotBase64 = await page.screenshot({ encoding: 'base64' });
            screenshot = `data:image/png;base64,${screenshotBase64}`;
          }
          
          // Update step to completed status
          const stepEndTime = Date.now();
          const stepDuration = stepEndTime - stepStartTime;
          await workflowProgressService.updateStepStatus(
            workflowExecution.id,
            stepExecution.id,
            'completed',
            {
              completedAt: new Date(),
              duration: stepDuration,
              screenshot: screenshot,
            }
          );
          
          // Wait if specified
          if (step.waitAfterMs && step.waitAfterMs > 0) {
            await new Promise(resolve => setTimeout(resolve, step.waitAfterMs));
          }
        } catch (error) {
          console.error(`Error executing step ${i + 1} of sequence ${sequence.id}:`, error);
          
          // Handle error with proper type checking
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Update step to failed status
          const stepEndTime = Date.now();
          const stepDuration = stepEndTime - stepStartTime;
          await workflowProgressService.updateStepStatus(
            workflowExecution.id,
            stepExecution.id,
            'failed',
            {
              completedAt: new Date(),
              duration: stepDuration,
              error: errorMessage,
            }
          );
          
          // Mark remaining steps as skipped
          for (let j = i + 1; j < stepExecutions.length; j++) {
            await workflowProgressService.updateStepStatus(
              workflowExecution.id,
              stepExecutions[j].id,
              'skipped'
            );
          }
          
          // Mark workflow execution as failed
          await workflowProgressService.updateExecution(workflowExecution.id, {
            status: 'failed',
            completedAt: new Date(),
            progress: Math.round(((i + 1) / steps.length) * 100),
            error: errorMessage,
          });
          
          throw error;
        }
      }
      
      // Mark workflow execution as completed
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      await workflowProgressService.updateExecution(workflowExecution.id, {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        duration: totalDuration,
      });
      
      return {
        sequenceId: sequence.id,
        executionId: workflowExecution.id,
        status: 'completed',
        results,
        duration: totalDuration,
      };
    } catch (error) {
      console.error(`Error executing sequence ${sequence.id}:`, error);
      
      // Handle error with proper type checking
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If workflow execution was created but the error happened before updating it as failed
      if (workflowExecution && workflowExecution.status !== 'failed') {
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        await workflowProgressService.updateExecution(workflowExecution.id, {
          status: 'failed',
          completedAt: new Date(),
          duration: totalDuration,
          error: errorMessage,
        });
      }
      
      return {
        sequenceId: sequence.id,
        executionId: workflowExecution?.id,
        status: 'failed',
        error: errorMessage,
        details: String(error), // Include full error details for debugging
      };
    } finally {
      // Close the browser when done
      if (page) {
        await this.closeBrowser(runSessionId);
      }
    }
  }

  /**
   * Execute a single step in a sequence
   * @param page Browser page
   * @param step The step to execute
   * @returns Result of the step execution
   */
  private async executeStep(page: Page, step: BrowserSequenceStep): Promise<any> {
    try {
      // Wait before executing if specified
      if (step.waitBeforeMs && step.waitBeforeMs > 0) {
        // Use setTimeout with Promise for waiting
        await new Promise(resolve => setTimeout(resolve, step.waitBeforeMs));
      }
      
      // Handle conditional execution
      if (step.isConditional && step.condition) {
        const condition = step.condition;
        // Define condition types for proper type checking
        type ElementExistsCondition = { type: 'elementExists'; selector: string };
        type ElementContainsTextCondition = { type: 'elementContainsText'; selector: string; text: string };
        type BrowserCondition = ElementExistsCondition | ElementContainsTextCondition;
        
        // Evaluate the condition on the page
        const shouldExecute = await page.evaluate((conditionData: any) => {
          // Cast to our expected types for proper type checking
          const condition = conditionData as BrowserCondition;
          
          // Element exists condition
          if (condition.type === 'elementExists') {
            return !!document.querySelector(condition.selector);
          }
          
          // Element contains text condition
          if (condition.type === 'elementContainsText') {
            const element = document.querySelector(condition.selector);
            if (!element) return false;
            return element.textContent?.includes(condition.text) || false;
          }
          
          // Default to true if condition type is unknown
          console.warn(`Unknown condition type: ${condition.type}`);
          return true;
        }, condition as any);
        
        if (!shouldExecute) {
          return {
            stepId: step.id,
            status: 'skipped',
            reason: 'Condition not met',
          };
        }
      }
      
      // Execute the step based on action type
      switch (step.actionType) {
        case 'navigation':
          if (step.targetUrl) {
            try {
              // Add more robust navigation options with timeout
              await page.goto(step.targetUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 // 30 second timeout
              });
              
              // Wait an additional short time for any JavaScript to execute
              await new Promise(resolve => setTimeout(resolve, 500));
              
              return {
                stepId: step.id,
                status: 'completed',
                action: 'navigation',
                url: step.targetUrl,
              };
            } catch (navError) {
              // Handle common navigation errors more gracefully
              console.error(`Navigation error to ${step.targetUrl}:`, navError);
              const errorMessage = navError instanceof Error ? navError.message : String(navError);
              
              // Special handling for timeout errors - try once more with a different strategy
              if (errorMessage.includes('timeout') || errorMessage.includes('net::ERR_')) {
                console.log(`Retrying navigation to ${step.targetUrl} with domcontentloaded...`);
                try {
                  // Try again with less strict waiting condition
                  await page.goto(step.targetUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                  });
                  
                  return {
                    stepId: step.id,
                    status: 'completed',
                    action: 'navigation',
                    url: step.targetUrl,
                    warning: 'Loaded with domcontentloaded after initial timeout'
                  };
                } catch (retryError) {
                  throw new Error(`Failed to navigate to ${step.targetUrl}: ${errorMessage}`);
                }
              }
              
              throw new Error(`Failed to navigate to ${step.targetUrl}: ${errorMessage}`);
            }
          }
          break;
          
        case 'click':
          if (step.targetElement) {
            try {
              // Increase timeout and wait for element to be visible
              await page.waitForSelector(step.targetElement, { 
                timeout: 10000,
                visible: true
              });
              
              // Try to scroll element into view for better reliability
              await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                  // Scroll the element into view if it's not already visible
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, step.targetElement);
              
              // Small delay to allow scrolling to complete
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Click the element
              await page.click(step.targetElement);
              
              return {
                stepId: step.id,
                status: 'completed',
                action: 'click',
                element: step.targetElement,
              };
            } catch (clickError) {
              console.error(`Error clicking element ${step.targetElement}:`, clickError);
              const errorMessage = clickError instanceof Error ? clickError.message : String(clickError);
              
              // If element wasn't found or wasn't clickable, try an alternative approach
              if (errorMessage.includes('timeout') || errorMessage.includes('not visible')) {
                console.log(`Retrying click on ${step.targetElement} with executeScript...`);
                try {
                  // Fallback: try to click using JavaScript
                  await page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    if (element) {
                      element.click();
                      return true;
                    }
                    return false;
                  }, step.targetElement);
                  
                  return {
                    stepId: step.id,
                    status: 'completed',
                    action: 'click',
                    element: step.targetElement,
                    warning: 'Used JavaScript click as fallback'
                  };
                } catch (fallbackError) {
                  throw new Error(`Failed to click element ${step.targetElement}: ${errorMessage}`);
                }
              }
              
              throw new Error(`Failed to click element ${step.targetElement}: ${errorMessage}`);
            }
          }
          break;
          
        case 'input':
          if (step.targetElement && step.valueOrText) {
            try {
              // Wait for element with increased timeout and visibility check
              await page.waitForSelector(step.targetElement, { 
                timeout: 10000,
                visible: true 
              });
              
              // First clear any existing value in the input field
              await page.evaluate((selector) => {
                const input = document.querySelector(selector) as HTMLInputElement;
                if (input && typeof input.value !== 'undefined') {
                  input.value = '';
                }
              }, step.targetElement);
              
              // Type the text into the field
              await page.type(step.targetElement, step.valueOrText);
              
              return {
                stepId: step.id,
                status: 'completed',
                action: 'input',
                element: step.targetElement,
                value: '********', // Mask input value in logs for security
              };
            } catch (inputError) {
              console.error(`Error typing into element ${step.targetElement}:`, inputError);
              const errorMessage = inputError instanceof Error ? inputError.message : String(inputError);
              
              // If element wasn't found or couldn't be typed into, try an alternative approach
              if (errorMessage.includes('timeout') || errorMessage.includes('not visible')) {
                console.log(`Retrying input on ${step.targetElement} with executeScript...`);
                try {
                  // Fallback: try to set value using JavaScript
                  await page.evaluate((selector, value) => {
                    const element = document.querySelector(selector) as HTMLInputElement;
                    if (element && typeof element.value !== 'undefined') {
                      element.value = value;
                      
                      // Trigger change and input events for reactive frameworks
                      const inputEvent = new Event('input', { bubbles: true });
                      const changeEvent = new Event('change', { bubbles: true });
                      element.dispatchEvent(inputEvent);
                      element.dispatchEvent(changeEvent);
                      return true;
                    }
                    return false;
                  }, step.targetElement, step.valueOrText);
                  
                  return {
                    stepId: step.id,
                    status: 'completed',
                    action: 'input',
                    element: step.targetElement,
                    value: '********', // Mask input value in logs
                    warning: 'Used JavaScript value setter as fallback'
                  };
                } catch (fallbackError) {
                  throw new Error(`Failed to input text into element ${step.targetElement}: ${errorMessage}`);
                }
              }
              
              throw new Error(`Failed to input text into element ${step.targetElement}: ${errorMessage}`);
            }
          }
          break;
          
        case 'submit':
          if (step.targetElement) {
            await page.waitForSelector(step.targetElement, { timeout: 5000 });
            await page.evaluate((selector) => {
              const form = document.querySelector(selector) as HTMLFormElement;
              if (form && typeof form.submit === 'function') {
                form.submit();
              } else {
                console.warn('Form not found or submit not available');
                // Fallback - try to trigger submit event
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                }
              }
            }, step.targetElement);
            return {
              stepId: step.id,
              status: 'completed',
              action: 'submit',
              element: step.targetElement,
            };
          }
          break;
          
        case 'screenshot': {
          // Create screenshot with proper error handling
          try {
            const screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
            const screenshotBase64 = screenshot.toString('base64');
            return {
              stepId: step.id,
              status: 'completed',
              action: 'screenshot',
              data: screenshotBase64,
            };
          } catch (screenshotError) {
            console.error('Error taking screenshot:', screenshotError);
            return {
              stepId: step.id,
              status: 'error',
              action: 'screenshot',
              error: 'Failed to capture screenshot',
            };
          }
        }
          
        case 'extract':
          if (step.targetElement) {
            const extractedData = await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              return element ? element.textContent : null;
            }, step.targetElement);
            return {
              stepId: step.id,
              status: 'completed',
              action: 'extract',
              element: step.targetElement,
              data: extractedData,
            };
          }
          break;
          
        default:
          return {
            stepId: step.id,
            status: 'error',
            error: `Unknown action type: ${step.actionType}`,
          };
      }
      
      // If we reach here, something went wrong
      return {
        stepId: step.id,
        status: 'error',
        error: 'Failed to execute step - missing required parameters',
      };
    } catch (error) {
      console.error(`Error executing step ${step.id}:`, error);
      // Handle error with proper type checking
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        stepId: step.id,
        status: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Take a screenshot of a webpage
   * @param url URL to capture
   * @param sessionId Optional session ID to use an existing browser
   * @returns Base64-encoded screenshot
   */
  async captureScreenshot(url: string, sessionId?: string, retryCount = 0): Promise<string> {
    const MAX_RETRIES = 2;
    const screenshotSessionId = sessionId || `screenshot-${Date.now()}`;
    let page: Page | null = null;
    
    try {
      page = await this.launchBrowser(screenshotSessionId);
      
      // Use more reliable navigation parameters with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 // 30 second timeout 
      });
      
      // Wait a short time for any animations or lazy-loaded content
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Ensure full-page screenshot with scroll
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        // Force any lazy-loading images that might be visible to load
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
          const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const lazyImg = entry.target as HTMLImageElement;
                if (lazyImg.dataset.src) {
                  lazyImg.src = lazyImg.dataset.src;
                }
              }
            });
          });
          io.observe(img);
        });
      });
      
      // Take the screenshot with higher quality
      const screenshot = await page.screenshot({ 
        type: 'jpeg', 
        quality: 90,
        fullPage: true 
      });
      
      return screenshot.toString('base64');
    } catch (error) {
      console.error(`Error capturing screenshot of ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Implement retry with exponential backoff for resilience
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying screenshot capture for ${url}...`);
        // Exponential backoff
        const backoffTime = 500 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // For retry, use a different waitUntil strategy
        return this.captureScreenshot(url, sessionId, retryCount + 1);
      }
      
      throw new Error(`Failed to capture screenshot of ${url} after ${retryCount + 1} attempts: ${errorMessage}. Please check if the URL is valid and the browser service is running properly.`);
    } finally {
      if (page && !sessionId) {
        // Only close if we created a new session for this screenshot
        await this.closeBrowser(screenshotSessionId);
      }
    }
  }

  /**
   * Extract data from a webpage using selectors
   * @param url URL to extract from
   * @param selectors Object mapping names to CSS selectors
   * @returns Extracted data
   */
  async extractData(url: string, selectors: Record<string, string>, retryCount = 0): Promise<Record<string, string | null>> {
    const MAX_RETRIES = 2;
    const extractSessionId = `extract-${Date.now()}`;
    let page: Page | null = null;
    
    try {
      page = await this.launchBrowser(extractSessionId);
      
      // Use more reliable navigation parameters with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 // 30 second timeout 
      });
      
      // Wait for the page to be fully loaded including dynamic content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result: Record<string, string | null> = {};
      
      // Extract data with more robust error handling for each selector
      for (const [name, selector] of Object.entries(selectors)) {
        try {
          // Try to wait for the selector to be present
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
          } catch (waitError) {
            // If selector doesn't appear, we'll still try to query it directly
            console.warn(`Selector "${selector}" not found within timeout, trying direct query`);
          }
          
          // Extract the text content
          result[name] = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return null;
            
            // Try multiple ways to get text content
            // 1. textContent (most comprehensive)
            // 2. innerText (respects styling like display:none)
            // 3. value attribute (for inputs)
            return element.textContent?.trim() || 
                   (element as HTMLElement).innerText?.trim() || 
                   (element as HTMLInputElement).value?.trim() || 
                   null;
          }, selector);
        } catch (selectorError) {
          console.error(`Error extracting data from selector "${selector}":`, selectorError);
          result[name] = null; // Set null for this selector but continue with others
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error extracting data from ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Implement retry with exponential backoff for resilience
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying data extraction from ${url}...`);
        // Exponential backoff
        const backoffTime = 500 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Try again with different waitUntil strategy for retry
        return this.extractData(url, selectors, retryCount + 1);
      }
      
      throw new Error(`Failed to extract data from ${url} after ${retryCount + 1} attempts: ${errorMessage}. Please verify the URL and selector syntax.`);
    } finally {
      if (page) {
        await this.closeBrowser(extractSessionId);
      }
    }
  }
}

// Export a singleton instance
export const browserAutomationService = new BrowserAutomationService();