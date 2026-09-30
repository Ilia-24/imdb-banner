const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Добавляем обёртки для совместимости с Express/Vercel API
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
