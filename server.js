const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  try {
    // Динамический импорт для поддержки ES-модулей Vercel
    const handlerModule = await import('./api/index.js');
    const handler = handlerModule.default || handlerModule;
    
    if (typeof handler === 'function') {
      await handler(req, res);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Server is live');
    }
  } catch (err) {
    console.error('Error handling request:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
