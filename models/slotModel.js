import mongoose from 'mongoose';

const slotSchema  = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: {type:String , required:true},
    betAmount: { type: Number, required: true },
    resultSide : { type: String, required: true },
    chosenSide : { type: String, required: true  },
    result: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
})

const slotModel = mongoose.model.slot || mongoose.model('slot', slotSchema);

export default slotModel;