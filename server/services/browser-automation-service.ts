import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer-core';
import path from 'path';
import { browserObserverService } from './browser-observer-service';
import type { BrowserSequence, BrowserSequenceStep } from '@shared/schema';

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
  async launchBrowser(sessionId: string): Promise<Page> {
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

      // Configuration for running in Docker container
      const launchOptions: LaunchOptions = {
        headless: true,
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
      console.error('Error launching browser:', error);
      // Enhanced error reporting with more context for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to launch browser: ${errorMessage}. Please check if the browser service is running properly.`);
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
  async runSequence(sequence: BrowserSequence, steps: BrowserSequenceStep[]): Promise<any> {
    if (!steps || steps.length === 0) {
      throw new Error('No steps provided for the sequence');
    }
    
    // Generate a unique session ID for this run
    const runSessionId = `sequence-run-${sequence.id}-${Date.now()}`;
    let page: Page | null = null;
    
    try {
      // Launch a new browser for this sequence
      page = await this.launchBrowser(runSessionId);
      
      // Execute each step in order
      const results = [];
      for (const step of steps) {
        const result = await this.executeStep(page, step);
        results.push(result);
        
        // Wait if specified
        if (step.waitAfterMs && step.waitAfterMs > 0) {
          // Use setTimeout with Promise for waiting
          await new Promise(resolve => setTimeout(resolve, step.waitAfterMs));
        }
      }
      
      return {
        sequenceId: sequence.id,
        status: 'completed',
        results,
      };
    } catch (error) {
      console.error(`Error executing sequence ${sequence.id}:`, error);
      // Handle error with proper type checking
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        sequenceId: sequence.id,
        status: 'error',
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
            await page.goto(step.targetUrl, { waitUntil: 'networkidle2' });
            return {
              stepId: step.id,
              status: 'completed',
              action: 'navigation',
              url: step.targetUrl,
            };
          }
          break;
          
        case 'click':
          if (step.targetElement) {
            await page.waitForSelector(step.targetElement, { timeout: 5000 });
            await page.click(step.targetElement);
            return {
              stepId: step.id,
              status: 'completed',
              action: 'click',
              element: step.targetElement,
            };
          }
          break;
          
        case 'input':
          if (step.targetElement && step.valueOrText) {
            await page.waitForSelector(step.targetElement, { timeout: 5000 });
            await page.type(step.targetElement, step.valueOrText);
            return {
              stepId: step.id,
              status: 'completed',
              action: 'input',
              element: step.targetElement,
              value: '********', // Mask input value in logs
            };
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
  async captureScreenshot(url: string, sessionId?: string): Promise<string> {
    const screenshotSessionId = sessionId || `screenshot-${Date.now()}`;
    let page: Page | null = null;
    
    try {
      page = await this.launchBrowser(screenshotSessionId);
      await page.goto(url, { waitUntil: 'networkidle2' });
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 90 });
      return screenshot.toString('base64');
    } catch (error) {
      console.error(`Error capturing screenshot of ${url}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to capture screenshot of ${url}: ${errorMessage}. Please check if the URL is valid and the browser service is running properly.`);
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
  async extractData(url: string, selectors: Record<string, string>): Promise<Record<string, string | null>> {
    const extractSessionId = `extract-${Date.now()}`;
    let page: Page | null = null;
    
    try {
      page = await this.launchBrowser(extractSessionId);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const result: Record<string, string | null> = {};
      
      for (const [name, selector] of Object.entries(selectors)) {
        result[name] = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent?.trim() || null : null;
        }, selector);
      }
      
      return result;
    } catch (error) {
      console.error(`Error extracting data from ${url}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract data from ${url}: ${errorMessage}. Please verify the URL and selector syntax.`);
    } finally {
      if (page) {
        await this.closeBrowser(extractSessionId);
      }
    }
  }
}

// Export a singleton instance
export const browserAutomationService = new BrowserAutomationService();