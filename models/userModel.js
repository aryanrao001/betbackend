import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, default: null },
    password: { type: String, required: true },
    phone: { type: Number, default: null },
    referal: { type: String },
    balance: { type: Number, default: 0 }
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
