import express from 'express';
import { fetchdetails, getUserHistory, loginUser, registerUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login',    loginUser);
userRouter.post('/fetchuser',fetchdetails);
userRouter.post('/history',  getUserHistory);


export default userRouter;