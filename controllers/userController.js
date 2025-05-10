import validator from 'validator';  // Correct import from validator package
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';  // Correct path to model

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

export { registerUser,loginUser };
