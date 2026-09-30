const micro = require('micro');

// Импортируем обработчик (проверяем оба возможных пути)
let handler;
try {
  handler = require('./api/index.js');
} catch (e) {
  try {
    handler = require('./api/index');
  } catch (err) {
    handler = require('./api');
  }
}

const port = process.env.PORT || 3000;
const server = micro(async (req, res) => {
  if (typeof handler === 'function') {
    return handler(req, res);
  } else if (handler && typeof handler.default === 'function') {
    return handler.default(req, res);
  } else {
    res.end('Server is working!');
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
