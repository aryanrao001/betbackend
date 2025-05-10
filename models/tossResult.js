import mongoose from "mongoose";

const tossResultSchema = new mongoose.Schema({
  result: { type: String, enum: ['heads', 'tails'], required: true },
  winningSide: { type: String, enum: ['heads', 'tails'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const TossResult = mongoose.model('TossResult', tossResultSchema);

export default TossResult;
