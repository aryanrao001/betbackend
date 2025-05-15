import express from "express";
import { bet_placed, declareResult, declareResultspin, sendTossResult, slotGameResult, slotGameResulttwo, spinbet_placed } from "../controllers/gameController.js";

const gameRoute = express.Router();

gameRoute.post('/toss',bet_placed);
gameRoute.post('/declare',declareResult);
gameRoute.post('/slot',slotGameResult);
gameRoute.post('/slottwo',slotGameResulttwo);
gameRoute.post('/spinbetplace', spinbet_placed);
gameRoute.get('/declarespinresult', declareResultspin);
gameRoute.get('/tossresult',sendTossResult);


export default gameRoute;
