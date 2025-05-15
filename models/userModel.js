import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, default: null },
    password: { type: String, required: true },
    phone: { type: Number, default: null },
    referal: { type: String , default: "Individual" },
    balance: { type: Number, default: 0 },
    accountNumber : { type: String , default:null },
    ifscCode :  {type:String , default: null},
    upiId: { type:String , default: null },
    bankName: { type:String , default: null },
    holderName : { type:String , default: null },
    holderphoneNumber : { type:String , default: null },

});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
