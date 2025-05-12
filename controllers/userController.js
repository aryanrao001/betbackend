import validator from 'validator';  // Correct import from validator package
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';  // Correct path to model
import tossModel from '../models/tossModel.js';
import spinModel from '../models/spinModel.js';
import slotModel from '../models/slotModel.js';


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


// export default getUserHistory;



export { registerUser , loginUser , fetchdetails , getUserHistory };
