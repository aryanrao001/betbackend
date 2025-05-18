import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRouter.js';
import gameRoute from './routes/gameRouter.js';
import setupRoundManager from './roundManager.js'; // ✅ IMPORT ROUND MANAGER
import srouter from './routes/simpleRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Connect to DB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/user', userRouter);
app.use('/api/games', gameRoute);
app.use('/api/bet',srouter);

app.get('/', (req, res) => {
  res.send('API Working');
});

// ✅ START ROUND + SOCKET SERVER
setupRoundManager(app, port);
