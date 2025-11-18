/**
 * WhatsApp Webhook Integration
 * This demonstrates how to integrate the Resume Editor with WhatsApp
 */

const express = require('express');
const ResumeEditor = require('./resume-editor');
const path = require('path');

const app = express();
app.use(express.json());

// In-memory storage (replace with database in production)
const userSessions = new Map();
const userTemplates = new Map();

// Initialize Resume Editor
const resumeEditor = new ResumeEditor();

/**
 * WhatsApp Webhook - Receive messages
 */
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { from, body } = req.body; // Simplified - actual structure depends on provider
    const userId = from;
    const message = body.toLowerCase().trim();

    console.log(`📱 Message from ${userId}: ${message}`);

    // Handle different intents
    if (message.includes('update my resume') || message.includes('update resume')) {
      return await handleResumeUpdate(userId, res);
    }

    if (message.includes('change') || message.includes('update')) {
      return await handleFieldUpdate(userId, message, res);
    }

    if (message === 'done' || message === 'finish') {
      return await finalizeResume(userId, res);
    }

    // Default response
    res.json({
      reply: "Hi! I can help you update your resume. Say 'update my resume' to get started! 📄"
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle resume update request
 */
async function handleResumeUpdate(userId, res) {
  // Check if user has a template
  if (!userTemplates.has(userId)) {
    return res.json({
      reply: `I don't have your resume template yet. Please upload your resume first, and I'll create a template for you. 📎`
    });
  }

  // Initialize session
  userSessions.set(userId, {
    stage: 'awaiting_update',
    updates: {}
  });

  return res.json({
    reply: `Great! I can help you update your resume. What would you like to change?\n\nExamples:\n• "Change job title to Senior Engineer"\n• "Update email to newemail@example.com"\n• "Add 2 years to experience"\n\nSay "done" when finished! ✏️`
  });
}

/**
 * Handle field update
 */
async function handleFieldUpdate(userId, message, res) {
  const session = userSessions.get(userId);

  if (!session) {
    return res.json({
      reply: 'Please say "update my resume" first to start an update session.'
    });
  }

  // Simple intent parsing (use NLP in production)
  const updates = parseUpdateIntent(message);

  if (!updates) {
    return res.json({
      reply: `I didn't quite understand that. Please try:\n• "Change [field] to [value]"\n• "Update [field] to [value]"\n\nExample: "Change job title to Senior Engineer"`
    });
  }

  // Store updates
  Object.assign(session.updates, updates);

  return res.json({
    reply: `✅ Got it! I'll update:\n${formatUpdates(updates)}\n\nAnything else? Say "done" to generate your updated resume.`
  });
}

/**
 * Finalize and generate updated resume
 */
async function finalizeResume(userId, res) {
  const session = userSessions.get(userId);

  if (!session || Object.keys(session.updates).length === 0) {
    return res.json({
      reply: 'No updates to apply. Say "update my resume" to start.'
    });
  }

  try {
    // Get user's template
    const templatePath = userTemplates.get(userId);

    // Generate updated resume
    const outputPath = path.join(__dirname, 'output', `resume-${userId}-${Date.now()}.pdf`);

    await resumeEditor.updateResumeFields(
      templatePath,
      session.updates,
      outputPath
    );

    // In production: Upload to S3/Cloud Storage and get URL
    const downloadUrl = `https://your-server.com/download/${path.basename(outputPath)}`;

    // Clear session
    userSessions.delete(userId);

    return res.json({
      reply: `🎉 Your resume has been updated!\n\nDownload: ${downloadUrl}\n\nChanges applied:\n${formatUpdates(session.updates)}`,
      attachment: outputPath // Send PDF directly via WhatsApp
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    return res.json({
      reply: `❌ Sorry, there was an error generating your resume. Please try again or contact support.`
    });
  }
}

/**
 * Parse user intent to extract update instructions
 * (Simplified - use NLP library like Wit.ai or Dialogflow in production)
 */
function parseUpdateIntent(message) {
  const updates = {};

  // Pattern: "change [field] to [value]"
  const changePattern = /(?:change|update|set)\s+(?:my\s+)?(.+?)\s+to\s+(.+)/i;
  const match = message.match(changePattern);

  if (match) {
    const field = match[1].trim();
    const value = match[2].trim();

    // Map natural language fields to CSS selectors
    const fieldMapping = {
      'job title': '#job-title-0',
      'title': '#job-title-0',
      'position': '#job-title-0',
      'company': '#company-0',
      'company name': '#company-0',
      'email': '#email',
      'phone': '#phone',
      'phone number': '#phone',
      'location': '#location',
      'address': '#location'
    };

    const selector = fieldMapping[field.toLowerCase()];
    if (selector) {
      updates[selector] = value;
    }
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

/**
 * Format updates for display
 */
function formatUpdates(updates) {
  return Object.entries(updates)
    .map(([selector, value]) => `  • ${selector}: "${value}"`)
    .join('\n');
}

/**
 * Webhook verification (for WhatsApp Business API)
 */
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'resume-editor-chatbot',
    timestamp: new Date().toISOString()
  });
});

/**
 * Example: Register user template
 * (In production, this would be triggered when user uploads their resume)
 */
app.post('/api/register-template', async (req, res) => {
  const { userId, templatePath } = req.body;

  userTemplates.set(userId, templatePath);

  res.json({
    success: true,
    message: 'Template registered successfully'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Resume Editor Chatbot running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Initialize browser
  await resumeEditor.init();
  console.log('✅ Resume Editor initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await resumeEditor.close();
  process.exit(0);
});

module.exports = app;
