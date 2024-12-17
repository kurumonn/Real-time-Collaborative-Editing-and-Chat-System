import express from 'express';
    import { createServer } from 'http';
    import { Server } from 'socket.io';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import session from 'express-session';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: '*', // Be sure to restrict this in production
        methods: ['GET', 'POST']
      }
    });

    // Session middleware
    app.use(
      session({
        secret: 'your-secret-key', // Replace with a real secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set to true in production if using HTTPS
      })
    );

    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'dist')));

    // Authentication middleware
    const isAuthenticated = (req, res, next) => {
      if (req.session && req.session.user) {
        return next();
      }
      res.status(401).json({ message: 'Unauthorized' });
    };

    // Hardcoded users for demonstration purposes
    const users = [
      {
        id: 1,
        username: 'testuser',
        password: 'testpassword'
      },
      {
        id: 2,
        username: 'testuser2',
        password: 'testpassword2'
      }
    ];

    // Authentication routes
    app.post('/login', (req, res) => {
      const { username, password } = req.body;
      const user = users.find(
        (u) => u.username === username && u.password === password
      );
      if (user) {
        req.session.user = user;
        res.json({ message: 'Login successful', user });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });

    app.post('/logout', (req, res) => {
      req.session.destroy();
      res.json({ message: 'Logout successful' });
    });

    app.get('/check-auth', (req, res) => {
      if (req.session && req.session.user) {
        res.json({ isLoggedIn: true, user: req.session.user });
      } else {
        res.json({ isLoggedIn: false });
      }
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    const PORT = process.env.PORT || 3000;

    // Socket.IO connection handling with authentication check
    io.on('connection', (socket) => {
      console.log('a user connected');

      const checkAuthentication = () => {
        const session = socket.request.session;
        if (!session || !session.user) {
          socket.emit('unauthorized', 'Authentication required');
          socket.disconnect();
          return false;
        }
        return true;
      };

      socket.on('join-document', (documentId) => {
        if (!checkAuthentication()) return;
        socket.join(documentId);
        console.log(`user joined document ${documentId}`);
      });

      socket.on('text-change', (data) => {
        if (!checkAuthentication()) return;
        socket.to(data.documentId).emit('text-change', data.delta);
      });

      socket.on('chat-message', (data) => {
        if (!checkAuthentication()) return;
        io.to(data.documentId).emit('chat-message', data.message);
      });

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
