import { Router } from 'express';
import { browserAutomationService } from '../services/browser-automation-service';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth-middleware'; // Corrected import path
import type { BrowserSequenceStep } from '@shared/schema';
import { handleError } from '../utils/errorHandler';


export const browserAutomationRouter = Router();

/**
 * Launch a browser session
 * POST /api/browser-automation/launch
 */
browserAutomationRouter.post('/launch', requireAuth, async (req, res) => {
  try {
    const sessionId = req.body.sessionId || `session-${Date.now()}`;
    const userId = req.user?.id; // Assuming requireAuth middleware adds user to req

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated or user ID not found in request.',
      });
    }

    // Launch the browser
    await browserAutomationService.launchBrowser(sessionId, userId, 0); // Pass userId and initial retryCount

    res.json({
      success: true,
      sessionId,
      message: 'Browser launched successfully'
    });
  } catch (error: any) {
    console.error('Error launching browser:', error);
    res.status(500).json({
      success: false,
      error: handleError(error), // Use handleError for consistent error messages
    });
  }
});

/**
 * Close a browser session
 * POST /api/browser-automation/close
 */
browserAutomationRouter.post('/close', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    await browserAutomationService.closeBrowser(sessionId);

    res.json({
      success: true,
      message: 'Browser session closed successfully'
    });
  } catch (error: any) {
    console.error('Error closing browser session:', error);
    res.status(500).json({
      success: false,
      error: handleError(error), // Use handleError for consistent error messages
    });
  }
});

/**
 * Run a browser sequence
 * POST /api/browser-automation/run-sequence
 */
browserAutomationRouter.post('/run-sequence', requireAuth, async (req, res) => {
  try {
    const { sequenceId, steps } = req.body;

    if (!sequenceId) {
      return res.status(400).json({
        success: false,
        error: 'Sequence ID is required'
      });
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid steps array is required'
      });
    }

    // Get the sequence from the database
    const sequence = await storage.getBrowserSequence(sequenceId);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        error: 'Sequence not found'
      });
    }

    // Run the sequence
    const userId = req.user?.id; // Assuming requireAuth middleware adds user to req
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated or user ID not found in request for runSequence.',
      });
    }
    const results = await browserAutomationService.runSequence(sequence, steps as BrowserSequenceStep[], userId);

    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Error running browser sequence:', error);
    res.status(500).json({
      success: false,
      error: handleError(error), // Use handleError for consistent error messages
    });
  }
});

/**
 * Take a screenshot
 * POST /api/browser-automation/screenshot
 */
browserAutomationRouter.post('/screenshot', requireAuth, async (req, res) => {
  try {
    const { url, sessionId } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Capture the screenshot
    const screenshot = await browserAutomationService.captureScreenshot(url, sessionId, 0);

    res.json({
      success: true,
      screenshot
    });
  } catch (error: any) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({
      success: false,
      error: handleError(error), // Use handleError for consistent error messages
    });
  }
});

/**
 * Extract data from a webpage
 * POST /api/browser-automation/extract-data
 */
browserAutomationRouter.post('/extract-data', requireAuth, async (req, res) => {
  try {
    const { url, selectors } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    if (!selectors || typeof selectors !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid selectors object is required'
      });
    }

    // Extract the data
    const data = await browserAutomationService.extractData(url, selectors, 0);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error extracting data:', error);
    res.status(500).json({
      success: false,
      error: handleError(error), // Use handleError for consistent error messages
    });
  }
});
