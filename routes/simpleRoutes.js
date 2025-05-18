import express from "express"
import {  declareTossResultFunction, placeBet } from "../controllers/simpleController.js";

const srouter = express.Router();

srouter.post('/place-bet',placeBet);
srouter.post('/declare-result', declareTossResultFunction);


export default srouter; 
