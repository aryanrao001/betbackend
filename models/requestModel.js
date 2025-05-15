import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [1, "Amount must be greater than zero"]
  },
  paymentMethod: {
    type: String,
    enum: ['online'],
    required: true,
    default: 'online'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true // to avoid duplicate entries
  },
  paymentScreenshotUrl: {
    type: String, // Optional: Cloudinary or local path to screenshot
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // adminRemark: {
  //   type: String,
  //   default: 'pending' // admin decision reason
  // },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date // when admin processes request
  }
});

const MoneyRequest = mongoose.model("MoneyRequest", requestSchema);

export default MoneyRequest;
