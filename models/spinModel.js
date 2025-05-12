import mongoose, { mongo } from 'mongoose';

const spinSchema = new mongoose.Schema({
    userId : {type: mongoose.Schema.Types.ObjectId, ref: 'user',required:true},
    userName: { type: String    , required:true},
    betAmount: { type:Number    , required:true},
    chosenSide: { type: String  , required:true },
    status :     { type:String  , default:'pending'}, 
    resultSide:   { type:String , default:null },
    createdAt:     { type:Date  , default:Date.now},
    resolvedAt:     { type:Date , }
});

const spinModel = mongoose.model.spin || mongoose.model('spin', spinSchema);

export default spinModel;


// userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     userName: {type:String , required:true},
//     betAmount: { type: Number, required: true },
//     chosenSide: { type: String, enum: ['heads', 'tails'], required: true },
//     status: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' },
//     resultSide: { type: String, enum: ['heads', 'tails'], default: null },
//     createdAt: { type: Date, default: Date.now },
//     resolvedAt: { type: Date }