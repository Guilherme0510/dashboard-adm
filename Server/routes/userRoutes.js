
import express from 'express';
import { activeUser, disableUser } from '../controllers/userController.js';

export const userRouter = express.Router();

userRouter.post('/disabled-user', disableUser);
userRouter.post('/active-user', activeUser);

