const express = require('express');
const app = express();

console.log('Starting test webhook...');

app.use(express.raw({ type: '*/*' }));

app.post('/webhook/lark', (req, res) => {
  console.log('Webhook called!');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('test_challenge_response');
});

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test webhook running on port ${PORT}`);
}); 