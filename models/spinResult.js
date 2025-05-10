import mongoose from "mongoose";

const spinResultSchema = new mongoose.Schema({
    result: { type:Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// const spinResult = mongoose.models.spinresult || mongoose.model('spinresult', spinResultSchema);
const spinResult = mongoose.models.SpinResult || mongoose.model('SpinResult', spinResultSchema);


export default spinResult;
