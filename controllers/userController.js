import validator from 'validator';  // Correct import from validator package
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';  // Correct path to model
import tossModel from '../models/tossModel.js';
import spinModel from '../models/spinModel.js';
import slotModel from '../models/slotModel.js';
import MoneyRequest from '../models/requestModel.js';
import withdrawRequest from '../models/withdrawRequest.js';
import mongoose from 'mongoose';


const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
}


const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Check if either email or phone is provided
    if (!email && !phone) {
      return res.json({ success: false, message: "Please provide either email or phone number to login." });
    }

    let user;

    // Find user by email or phone depending on what is provided
    if (email) {
      user = await userModel.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "No user found with this email." });
      }
    } else if (phone) {
      user = await userModel.findOne({ phone });
      if (!user) {
        return res.json({ success: false, message: "No user found with this phone number." });
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password." });
    }

    // Generate token
    const token = createToken(user._id);

    // Return success response with token
    res.json({ success: true, message: "Login successful", token });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, referal } = req.body;

    // Ensure at least one of email or phone is provided
    if (!email && !phone) {
      return res.json({ success: false, message: "Please provide either an email or phone number." });
    }

    // Email registration flow
    if (email) {
      const exists = await userModel.findOne({ email });
      if (exists) {
        return res.json({ success: false, message: "A user already exists with this email." });
      }
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Please enter a valid email." });
      }
    }

    // Phone registration flow
    if (phone) {
      const exists = await userModel.findOne({ phone });
      if (exists) {
        return res.json({ success: false, message: "A user already exists with this phone number." });
      }
    }

    // Password validation
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password (at least 8 characters)." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object with both email and phone if both are provided
    const newUser = new userModel({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword,
      referal,
    });

    const user = await newUser.save();
    const token = createToken(user._id);

    res.json({ success: true, message: "Registration successful", token });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const fetchdetails = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Token not provided" });
    }

    const token = authHeader.split(' ')[1]; // ✅ Correct way to extract the token

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ success: false, message: "Login Again Please" });
    }

    const user_id = decoded.id;
    const userData = await userModel.findById(user_id);

    if (!userData) {
      return res.status(404).json({ success: false, message: "User Not Found" });
    }

    res.json({ success: true, message: "User Details", userData });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};





const getUserHistory = async (req, res) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Authorization token required" });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing in Authorization header" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ success: false, message: "Login Again Please" });
    }

    // Decode token to get userId
    const userId = decoded.id;

    // Check user existence
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch all game histories
    const [tossHistory, spinHistory, slotHistory] = await Promise.all([
      tossModel.find({ userId: userId }).populate('userId', 'name').sort({ createdAt: -1 }),
      spinModel.find({ userId: userId }).populate('userId', 'name').sort({ createdAt: -1 }),
      slotModel.find({ userId: userId }).populate('userId', 'name').sort({ createdAt: -1 }),
    ]);

    // Combine and format activities
    const activities = [
      ...tossHistory.map(item => ({
        type: 'toss',
        betAmount: item.betAmount,
        chosenSide: item.chosenSide,
        resultSide: item.resultSide,
        status: item.status,
        createdAt: item.createdAt,
        resolvedAt: item.resolvedAt,
      })),
      ...spinHistory.map(item => ({
        type: 'spin',
        betAmount: item.betAmount,
        chosenSide: item.chosenSide,
        resultSide: item.resultSide,
        status: item.status,
        createdAt: item.createdAt,
        resolvedAt: item.resolvedAt,
      })),
      ...slotHistory.map(item => ({
        type: 'slot',
        betAmount: item.betAmount,
        chosenSide: item.chosenSide,
        resultSide: item.resultSide,
        result: item.result,
        createdAt: item.createdAt,
      })),
    ];

    // Sort by createdAt descending
    activities.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, data: activities });

  } catch (error) {
    console.error('Error in getUserHistory:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



const requestAddMoney = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID missing in token' });
    }

    const userData = await userModel.findById(userId);
    const userName = userData.name;

    const { amount, paymentMethod, transactionId } = req.body;
    const screenshotFile = req.file;
    const paymentScreenshotUrl = screenshotFile ? `/uploads/${screenshotFile.filename}` : null;

    if (!amount || !paymentMethod || !transactionId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingTx = await MoneyRequest.findOne({ transactionId });
    if (existingTx) {
      return res.status(409).json({ success: false, message: 'Transaction ID already used' });
    }

    const userExists = await userModel.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newRequest = new MoneyRequest({
      userId,
      userName,
      amount,
      paymentMethod,
      transactionId,
      paymentScreenshotUrl,
      requestedAt: new Date()
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: 'Add money request submitted successfully.',
      requestId: newRequest._id
    });
  } catch (err) {
    console.error('Add Money Request Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const allrequests = async (req, res) => {
  try {
    const requests = await MoneyRequest.find({});
    if (!requests) {
      return res.status(404).json({ success: false, message: 'No Entries Found' });
    }
    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


const onlyrequests = async (req, res) => {
  try {
    const requests = await MoneyRequest.find({ status: 'pending' });
    if (!requests) {
      return res.status(404).json({ success: false, message: 'No requests found' });
    }
    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching only requests:', error);
  }
}








const approveRequest = async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the request document
    const request = await MoneyRequest.findById(id).session(session);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Find the associated user
    const user = await userModel.findById(request.userId).session(session);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increase the user's balance by the requested amount
    user.balance += request.amount;

    // Update the request status to 'approved'
    request.status = 'approved';

    // Save both the user and request changes
    await user.save({ session });
    await request.save({ session });

    // Commit the transaction to make all changes permanent
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Request approved successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error approving request:', error);
    return res.status(500).json({ message: 'Server error while approving request' });
  }
};

const rejectRequest = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the request document
    const request = await MoneyRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update the request status to 'rejected'
    request.status = 'rejected';
    await request.save();

    return res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    return res.status(500).json({ message: 'Server error while rejecting request' });
  }
};



// const handleRequestStatusChange = async (req, res) => {
//     const { id, status } = req.params; // Get request ID and desired status (approved/rejected)

//     try {
//         // Find the request by ID
//         const request = await MoneyRequest.findById(id);
//         if (!request) {
//             return res.status(404).json({ message: 'Request not found' });
//         }

//         // Find the user associated with the request
//         const user = await userModel.findById(request.userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Start a session for transaction (optional, if you want atomic updates)
//         const session = await mongoose.startSession();
//         session.startTransaction();

//         // If approved, increase the user's balance by the requested amount
//         if (status === 'approved') {
//             user.balance += request.amount; // Update user's balance
//             await user.save({ session }); // Save user changes within the session

//             // Update the request status to 'approved'
//             request.status = 'approved';
//         } else if (status === 'rejected') {
//             // If rejected, only update the request status
//             request.status = 'rejected';
//         }

//         // Save the updated request status
//         await request.save({ session });

//         // Commit the transaction to make all changes permanent
//         await session.commitTransaction();
//         session.endSession();

//         // Return the updated status and user details
//         return res.status(200).json({
//             message: `Request ${status}`,
//             request,
//             user,
//         });
//     } catch (error) {
//         // If an error occurs, abort the transaction and handle the error
//         console.error('Error handling request status change:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };
















// const requestAddMoney = async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith('Bearer ')) {
//       return res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
//     }

//     const token = authHeader.split(' ')[1];

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ success: false, message: 'Invalid token' });
//     }

//     const userId = decoded.id || decoded.userId;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'User ID missing in token' });
//     }

//     const userData = await userModel.findById(userId);
//     const userName = userData.name;

//     const { amount, paymentMethod, transactionId } = req.body;
//     const screenshotFile = req.file;
//     const paymentScreenshotUrl = screenshotFile ? `/uploads/${screenshotFile.filename}` : null;

//     if (!amount || !paymentMethod || !transactionId) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     const existingTx = await MoneyRequest.findOne({ transactionId });
//     if (existingTx) {
//       return res.status(409).json({ success: false, message: 'Transaction ID already used' });
//     }

//     const userExists = await userModel.findById(userId);
//     if (!userExists) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const newRequest = new MoneyRequest({
//       userId,
//       userName,
//       amount,
//       paymentMethod,
//       transactionId,
//       paymentScreenshotUrl,
//       requestedAt: new Date()
//     });

//     await newRequest.save();

//     res.status(201).json({
//       success: true,
//       message: 'Add money request submitted successfully.',
//       requestId: newRequest._id
//     });
//   } catch (err) {
//     console.error('Add Money Request Error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };




const withdraw = async (req, res) => {
  try {
    const {  accountNumber, ifscCode, upiId, holderphoneNumber, holderName ,amount  } = req.body;
    // console.log(req.body)
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.json({ success: false, message: 'You are not logged in' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.json({ success: false, message: "Invalid login details" });
  }

  const userId = decoded.id;
  if (!userId) {
    return res.json({ success: false, message: "Your ID is missing in token" });
  }

  const userData = await userModel.findById(userId);
  if (!userData) {
    return res.json({ success: false, message: "User not found. Register first." });
  }

  const userName = userData.name;
  const userbalance = userData.balance;

  if (userbalance < amount) {
    return res.json({ success: false, message: "Your amount exceeds your balance" });
  }

  if (!accountNumber && !ifscCode && !upiId) {
    return res.json({ success: false, message: "Please provide either Account Details or your UPI ID" });
  }

  if (!holderphoneNumber) {
    return res.json({ success: false, message: "Provide a phone number" });
  }

  if (!holderName) {
    return res.json({ success: false, message: "Enter holder name" });
  }

   const updateFields = {};
  if (!userData.accountNumber && accountNumber) updateFields.accountNumber = accountNumber;
  if (!userData.ifscCode && ifscCode) updateFields.ifscCode = ifscCode;
  if (!userData.upiId && upiId) updateFields.upiId = upiId;
  if (!userData.phone && holderphoneNumber) updateFields.phone = holderphoneNumber;
  if (!userData.holderphoneNumber && holderphoneNumber) updateFields.holderphoneNUmber = holderphoneNumber
  if (!userData.holderName && holderName) updateFields.holderName = holderName;

  if (Object.keys(updateFields).length > 0) {
    await userModel.updateOne({ _id: userId }, { $set: updateFields });
  }

  const newRequest = new withdrawRequest({
      userId,
      userName,
      amount,
      accountNumber,
      ifscCode,
      upiId,
      holderphoneNumber : holderphoneNumber,
      holderName,
    });

  await newRequest.save();
  // Proceed to save the withdraw request here...
  res.json({ success: true, message: "Withdraw request submitted" });
  } catch (error) {
    console.error('Add Withdraw Request Error:', error);
    res.json({ success: false, message: 'Server error' });

  }
};



const allwithdrawreq = async (req, res) => {
  try {
    const requests = await withdrawRequest.find({});
    if (!requests) {
      return res.status(404).json({ success: false, message: 'No Entries Found' });
    }
    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}



const onlywithdrawrequests = async (req, res) => {
  try {
    const requests = await withdrawRequest.find({ status: 'pending' });
    if (!requests) {
      return res.status(404).json({ success: false, message: 'No requests found' });
    }
    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching only requests:', error);
  }
}




const withdrawApproveRequest = async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the request document
    const request = await withdrawRequest.findById(id).session(session);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Find the associated user
    const user = await userModel.findById(request.userId).session(session);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increase the user's balance by the requested amount
    user.balance -= request.amount;

    // Update the request status to 'approved'
    request.status = 'approved';

    // Save both the user and request changes
    await user.save({ session });
    await request.save({ session });

    // Commit the transaction to make all changes permanent
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Request approved successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error approving request:', error);
    return res.status(500).json({ message: 'Server error while approving request' });
  }
};

const withdrawRejectRequest = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the request document
    const request = await withdrawRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update the request status to 'rejected'
    request.status = 'rejected';
    await request.save();

    return res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    return res.status(500).json({ message: 'Server error while rejecting request' });
  }
};





export { 
  registerUser,
  loginUser, 
  fetchdetails, 
  getUserHistory, 
  getAllUsers, 
  requestAddMoney, 
  allrequests, 
  approveRequest, 
  rejectRequest, 
  onlyrequests , 
  withdraw , 
  allwithdrawreq ,
  withdrawApproveRequest , 
  withdrawRejectRequest , 
  onlywithdrawrequests };
