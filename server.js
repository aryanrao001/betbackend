import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './config/mongodb.js';
import userRouter from './routes/userRouter.js';
import gameRoute from './routes/gameRouter.js';

const app = express();
const port = process.env.PORT || 4000;

// Call the connectDB function to connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());


//All Routes
app.use('/api/user',userRouter);
app.use('/api/games',gameRoute);

app.get('/', (req, res) => {
  res.send("API Working");
});

app.listen(port, () => console.log(`Server started on Port no ${port}`));
