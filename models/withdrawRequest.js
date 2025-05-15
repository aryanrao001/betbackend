import mongoose from 'mongoose';

const withrequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  userName: { type: String, required: true},
  amount: { type: String, required: true, min: [1, "Amount must be greater than zero"] },
  accountNumber:{ type:String, default:null },
  ifscCode:{ type:String,  default:null },
  upiId:{   type:String,   default:null },
  holderphoneNumber:{ type:Number, required:true },
  holderName:{ type:String, required:true },
  status:{ type:String, required:true, default:"pending", enum: ['pending', 'approved', 'rejected'],},
  requestedAt: { type: Date, default: Date.now },
});

const withdrawRequest = mongoose.model("withdrawRequest", withrequestSchema);

export default withdrawRequest;
