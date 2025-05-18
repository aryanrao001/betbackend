// roundManager.js
import { Server } from 'socket.io';
import { createServer } from 'http';
import { calculateTossResult } from './utils/tossLogic.js';
import {
  currentBets,
  resetBets,
  setBettingStatus,
  declareTossResultFunction, // ✅ Imported proper toss logic
} from './controllers/simpleController.js';

let io;
let isBettingOpen = true;
let currentResult = null;

const setupRoundManager = (app, port) => {
  const httpServer = createServer(app);

  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const roundTime = 30;
  let timeRemaining = roundTime;

  setInterval(() => {
    timeRemaining--;

    // ❌ Close betting at 10 seconds
    if (timeRemaining === 10) {
      isBettingOpen = false;
      setBettingStatus(false);
      console.log('❌ Betting Closed');
    }

    // ✅ Declare result with full DB + logic
    if (timeRemaining === 1) {
      declareTossResultFunction().then((resultObj) => {
        if (resultObj?.result) {
          currentResult = resultObj.result;
          io.emit('tossResult', resultObj);
          console.log('🎯 Result declared from DB function:', resultObj);
        } else {
          console.warn('❌ Toss result could not be declared:', resultObj);
        }
      });
    }

    // 🔁 Start new round
    if (timeRemaining <= 0) {
      timeRemaining = roundTime;
      isBettingOpen = true;
      setBettingStatus(true);
      currentResult = null;
      io.emit('round-start', { message: '🔁 New round started' });
      console.log('🕒 New round started');
    }

    io.emit('timer', timeRemaining);
  }, 1000);

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.emit('timer', timeRemaining);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server + Socket.IO running on port ${port}`);
  });
};

export default setupRoundManager;
