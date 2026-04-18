import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-shop', (shopId) => {
      socket.join(`shop-${shopId}`);
    });

    socket.on('new-appointment', (data) => {
      socket.broadcast.to(`shop-${data.shopId}`).emit('appointment-created', data);
    });

    socket.on('update-appointment', (data) => {
      socket.broadcast.to(`shop-${data.shopId}`).emit('appointment-updated', data);
    });

    socket.on('delete-appointment', (data) => {
      socket.broadcast.to(`shop-${data.shopId}`).emit('appointment-deleted', data);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});