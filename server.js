const http = require('http');
const port = process.env.PORT || 3000;

// Маскируем запросы сервера под обычный браузер
global.fetch = (originalFetch => (url, opts = {}) => {
  opts.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...opts.headers,
  };
  return originalFetch(url, opts);
})(global.fetch || fetch);

const server = http.createServer(async (req, res) => {
  // Эмуляция методов Express/Vercel
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };

  res.send = function (body) {
    if (typeof body === 'object' && !Buffer.isBuffer(body)) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    } else {
      res.end(body);
    }
    return res;
  };

  res.json = function (jsonBody) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jsonBody));
    return res;
  };

  try {
    const handlerModule = await import('./api/index.js');
    const handler = handlerModule.default || handlerModule;

    if (typeof handler === 'function') {
      await handler(req, res);
    } else {
      res.status(200).send('Server is live');
    }
  } catch (err) {
    console.error('Error handling request:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
