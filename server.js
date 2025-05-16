import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/mongodb.js';
import userRouter from './routes/userRouter.js';
import gameRoute from './routes/gameRouter.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server for socket.io to use
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Change this to your frontend URL in production
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/user', userRouter);
app.use('/api/games', gameRoute);

// Root route
app.get('/', (req, res) => {
  res.send('API Working');
});

// Global toss round timer
let startTime = Date.now();

setInterval(() => {
  startTime = Date.now();
  io.emit('timerUpdate', { startTime });
  console.log('New round started at:', new Date(startTime).toLocaleTimeString());
}, 25000);

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current round time immediately to new connection
  socket.emit('timerUpdate', { startTime });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server started on Port ${port}`);
});
