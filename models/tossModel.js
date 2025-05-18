import mongoose from "mongoose";

const tossSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    userName: {type:String , required:true},
    betAmount: { type: Number, required: true },
    chosenSide: { type: String, enum: ['heads', 'tails'], required: true },
    status: { type: String, enum: ['pending', 'win', 'lose'], default: 'pending' },
    resultSide: { type: String, enum: ['heads', 'tails'], default: null },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
})

const tossModel = mongoose.model.toss || mongoose.model('toss', tossSchema);

export default tossModel;