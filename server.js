import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import connectDB from './config/mongodb.js';
import userRouter from './routes/userRouter.js';
import gameRoute from './routes/gameRouter.js';

const app = express();
const port = process.env.PORT || 4000;

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

app.get('/', (req, res) => {
  res.send("API Working");
});

app.listen(port, () => console.log(`Server started on Port no ${port}`));
