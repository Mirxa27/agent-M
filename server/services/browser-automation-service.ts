import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer-core';
import path from 'path';
import { browserObserverService } from './browser-observer-service';
import { workflowProgressService } from './workflow-progress-service';
import type {
  BrowserSequence,
  BrowserSequenceStep as SharedBrowserSequenceStep, // Alias to avoid conflict
  WorkflowExecution,
  WorkflowStepExecution
} from '@shared/schema';

// Temporary interface augmentation until schema is updated
interface BrowserSequenceStep extends SharedBrowserSequenceStep {
  takeScreenshot?: boolean;
}

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
   * @param userId The ID of the user initiating the session
   * @returns The browser page object
   */
  async launchBrowser(sessionId: string, userId?: number, retryCount = 0): Promise<Page> {
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
      // Ensure userId is passed; if it's for a generic task without a specific user,
      // a system user ID or a specific handling might be needed.
      // For now, we assume userId will be provided when user-specific recording is expected.
      await this.setupPageForAutomation(page, sessionId, userId);

      return page;
    } catch (error) {
      console.error(`Error launching browser (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);

      // Add retry logic with exponential backoff for resilience
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying browser launch for session ${sessionId}...`);
        // Exponential backoff: wait longer between retries (500ms, 1000ms)
        const backoffTime = 500 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.launchBrowser(sessionId, userId, retryCount + 1);
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
   * @param userId The ID of the user for whom actions are being recorded
   */
  private async setupPageForAutomation(page: Page, sessionId: string, userId?: number): Promise<void> {
    // Configure viewport for consistent rendering
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent to a standard one
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');

    // Set up page event listeners to record actions
    await page.exposeFunction('recordAction', async (action: any) => {
      // If userId is not provided here, actions might be recorded generically or an error might be thrown.
      // For user-specific recording, userId is essential.
      // Using a default or system user ID if undefined, or making it mandatory based on context.
      // For now, let's assume if userId is undefined, it's a non-user-specific action or an issue.
      // However, browserActions schema requires userId. So, it must be provided.
      // If userId is not available, we should not record or use a specific system/anonymous ID.
      // For this fix, we assume userId will be correctly passed down.
      if (typeof userId !== 'number') {
        console.warn(`recordAction called without a valid userId for session ${sessionId}. Action not recorded.`);
        return;
      }
      await browserObserverService.recordAction({
        userId: userId,
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
        // Similar to above, userId is crucial here.
        if (typeof userId !== 'number') {
          console.warn(`framenavigated event for session ${sessionId} without a valid userId. Action not recorded.`);
          return;
        }
        await browserObserverService.recordAction({
          userId: userId,
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
    steps: BrowserSequenceStep[], // Uses augmented interface
    userId?: number, // Should be number if workflow tracking is user-specific
    browserSessionId?: string
  ): Promise<any> {
    if (!steps || steps.length === 0) {
      throw new Error('No steps provided for the sequence');
    }
    if (typeof userId !== 'number') {
      // Or handle as a system/anonymous execution if schema allows nullable userId for workflowExecutions
      throw new Error('A valid userId is required to run a sequence with workflow tracking.');
    }

    const runSessionId = browserSessionId || `sequence-run-${sequence.id}-${Date.now()}`;
    let page: Page | null = null;
    let workflowExecution: WorkflowExecution | null = null;
    const startTime = Date.now();

    try {
      // Create a workflow execution record (this also creates pending step executions)
      workflowExecution = await workflowProgressService.startExecution({
        sequenceId: sequence.id,
        userId: userId, // userId is now guaranteed to be a number
        browserSessionId: runSessionId,
        status: 'running', // Initial status
        startedAt: new Date(),
        progress: 0,
        // currentStepOrder and currentStepId will be set as steps progress
      });

      // Launch a new browser for this sequence, passing the userId
      page = await this.launchBrowser(runSessionId, userId);

      // Fetch the created step execution records to iterate through them
      const stepExecutions = await workflowProgressService.getStepExecutions(workflowExecution.id);
      if (stepExecutions.length !== steps.length) {
        throw new Error("Mismatch between provided steps and created step execution records.");
      }

      const results = [];
      for (let i = 0; i < steps.length; i++) {
        const currentStepDefinition = steps[i]; // From input, may have .takeScreenshot
        const currentStepExecution = stepExecutions.find(se => se.order === currentStepDefinition.stepOrder);

        if (!currentStepExecution) {
          throw new Error(`Could not find step execution for order ${currentStepDefinition.stepOrder}`);
        }

        const stepStartTime = Date.now();

        try {
          await workflowProgressService.startStepExecution(workflowExecution.id, currentStepExecution.stepId);
          await workflowProgressService.updateExecutionProgress(
            workflowExecution.id,
            'running',
            Math.round((i / steps.length) * 100),
            currentStepExecution.stepId
          );

          // Execute the step
          const result = await this.executeStep(page, currentStepDefinition);
          results.push(result);

          let screenshot = null;
          if (currentStepDefinition.takeScreenshot) { // Check augmented property
            const screenshotBase64 = await page.screenshot({ encoding: 'base64' });
            screenshot = `data:image/png;base64,${screenshotBase64}`;
          }

          await workflowProgressService.completeStepExecution(
            workflowExecution.id,
            currentStepExecution.stepId,
            result, // Store step result if needed
            screenshot || undefined // Ensure undefined if null
          );

          // Wait if specified
          if (currentStepDefinition.waitAfterMs && currentStepDefinition.waitAfterMs > 0) {
            await new Promise(resolve => setTimeout(resolve, currentStepDefinition.waitAfterMs));
          }
        } catch (error) {
          console.error(`Error executing step ${i + 1} (ID: ${currentStepExecution.stepId}) of sequence ${sequence.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Attempt to capture screenshot on error if not already done
          let errorScreenshot = null;
          if (page && !page.isClosed()) {
            try {
              const screenshotBase64 = await page.screenshot({ encoding: 'base64' });
              errorScreenshot = `data:image/png;base64,${screenshotBase64}`;
            } catch (scrError) {
              console.error("Failed to take screenshot on error:", scrError);
            }
          }

          await workflowProgressService.failStepExecution(
            workflowExecution.id,
            currentStepExecution.stepId,
            errorMessage,
            errorScreenshot || undefined // Ensure undefined if null
          );
          // failStepExecution should update the main workflowExecution status to 'failed'

          throw error; // Re-throw to stop sequence execution
        }
      }

      // If all steps completed successfully
      const finalProgress = await workflowProgressService.calculateProgress(workflowExecution.id);
      await workflowProgressService.updateExecutionProgress(
        workflowExecution.id,
        'completed',
        finalProgress // Should be 100 if all steps ran
      );

      const finalExecutionState = await workflowProgressService.getExecution(workflowExecution.id);
      const totalDuration = finalExecutionState?.completedAt ? new Date(finalExecutionState.completedAt).getTime() - startTime : Date.now() - startTime;

      return {
        sequenceId: sequence.id,
        executionId: workflowExecution.id, // workflowExecution is not null here
        status: 'completed', // This might be overwritten if a step failed and threw
        results,
        duration: totalDuration, // Calculated based on final execution state
      };
    } catch (error) { // Catches error re-thrown from step failure
      console.error(`Sequence ${sequence.id} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (workflowExecution) { // workflowExecution should be non-null if startExecution succeeded
        // Ensure the main execution is marked as failed if not already by failStepExecution
        const currentWorkflowState = await workflowProgressService.getExecution(workflowExecution.id);
        if (currentWorkflowState && currentWorkflowState.status !== 'failed') {
           await workflowProgressService.updateExecutionProgress(
            workflowExecution.id,
            'failed',
            await workflowProgressService.calculateProgress(workflowExecution.id),
            currentWorkflowState.currentStepId || undefined, // Ensure undefined if null
            errorMessage
          );
        }
      }

      return {
        sequenceId: sequence.id,
        executionId: workflowExecution?.id, // workflowExecution might be null if startExecution failed
        status: 'failed',
        error: errorMessage,
        details: String(error),
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
        const shouldExecute = await page.evaluate((data: {type: string, selector?: string, text?: string}) => {
          // No need to cast to BrowserCondition here, work directly with data's known shape
          if (data.type === 'elementExists' && typeof data.selector === 'string') {
            return !!document.querySelector(data.selector);
          }

          if (data.type === 'elementContainsText' && typeof data.selector === 'string' && typeof data.text === 'string') {
            const element = document.querySelector(data.selector);
            if (!element) return false;
            return element.textContent?.includes(data.text) || false;
          }

          // Default for unknown or malformed conditions
          console.warn(`Unknown or malformed condition: type=${data.type}, selector=${data.selector || 'N/A'}, text=${data.text || 'N/A'}`);
          return true; // Defaulting to execute if condition is uninterpretable or not met by known types
        }, step.condition as any); // step.condition is jsonb, so 'as any' is okay for passing to evaluate

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
                    if (element && typeof (element as HTMLElement).click === 'function') {
                      (element as HTMLElement).click();
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
   * @param retryCount Number of retries attempted (must be provided, e.g., 0 for initial call)
   * @returns Base64-encoded screenshot
   */
  async captureScreenshot(url: string, sessionId: string | undefined, retryCount: number): Promise<string> {
    const MAX_RETRIES = 2; // Max retries, so 3 attempts total
    const screenshotSessionId = sessionId || `screenshot-${Date.now()}`;
    let page: Page | null = null;
    // userId might be relevant if actions during screenshotting need to be tied to a user.
    // For now, captureScreenshot is treated as a utility not directly recording user actions for sequences.
    // If it were to record, userId would need to be passed to launchBrowser.

    try {
      page = await this.launchBrowser(screenshotSessionId, undefined, retryCount); // Pass undefined for userId if not applicable

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
        return await this.captureScreenshot(url, sessionId, retryCount + 1); // Added await
      }

      throw new Error(`Failed to capture screenshot of ${url} after ${MAX_RETRIES + 1} attempts: ${errorMessage}. Please check if the URL is valid and the browser service is running properly.`);
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
   * @param retryCount Number of retries attempted (must be provided, e.g., 0 for initial call)
   * @returns Extracted data
   */
  async extractData(url: string, selectors: Record<string, string>, retryCount: number): Promise<Record<string, string | null>> {
    const MAX_RETRIES = 2; // Max retries, so 3 attempts total
    const extractSessionId = `extract-${Date.now()}`;
    let page: Page | null = null;
    // Similar to captureScreenshot, if data extraction needs to record actions tied to a user,
    // userId would be needed for launchBrowser. Assuming not for now.

    try {
      page = await this.launchBrowser(extractSessionId, undefined, retryCount); // Pass undefined for userId if not applicable

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
        return await this.extractData(url, selectors, retryCount + 1); // Added await
      }

      throw new Error(`Failed to extract data from ${url} after ${MAX_RETRIES + 1} attempts: ${errorMessage}. Please verify the URL and selector syntax.`);
    } finally {
      if (page) {
        await this.closeBrowser(extractSessionId);
      }
    }
  }
}

// Export a singleton instance
export const browserAutomationService = new BrowserAutomationService();
