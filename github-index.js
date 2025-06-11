const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// CORS for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Lark webhook verification endpoint
app.post('/webhook/lark', (req, res) => {
  console.log('🔐 Received webhook request:', JSON.stringify(req.body, null, 2));
  
  try {
    // Handle Lark webhook verification challenge
    if (req.body && req.body.challenge) {
      console.log('🔐 Lark webhook verification challenge received:', req.body.challenge);
      return res.status(200).json({ challenge: req.body.challenge });
    }

    // Handle Lark webhook verification with type field
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 Lark webhook URL verification received:', req.body.challenge);
      return res.status(200).json({ challenge: req.body.challenge });
    }

    // For any other request, return success
    console.log('📧 Received actual webhook:', JSON.stringify(req.body, null, 2));
    return res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      data: req.body
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Alternative endpoint for testing
app.post('/api/webhooks/lark-verify', (req, res) => {
  console.log('🔐 Alternative endpoint - Received webhook request:', JSON.stringify(req.body, null, 2));
  
  try {
    // Handle Lark webhook verification challenge
    if (req.body && req.body.challenge) {
      console.log('🔐 Challenge received:', req.body.challenge);
      return res.status(200).json({ challenge: req.body.challenge });
    }

    // Handle Lark webhook verification with type field
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL verification received:', req.body.challenge);
      return res.status(200).json({ challenge: req.body.challenge });
    }

    // For any other request, return success
    return res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DocaFlex Temporary Lark Webhook Server',
    timestamp: new Date().toISOString(),
    endpoints: {
      primary: '/webhook/lark',
      alternative: '/api/webhooks/lark-verify'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 DocaFlex Temporary Webhook Server running on port ${port}`);
  console.log(`📍 Primary webhook endpoint: /webhook/lark`);
  console.log(`📍 Alternative webhook endpoint: /api/webhooks/lark-verify`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
}); 