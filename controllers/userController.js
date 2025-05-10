import validator from 'validator';  // Correct import from validator package
import bcrypt from 'bcrypt';
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
        const { name, email, phone, password, referal, registerType } = req.body;

        // Check if registerType is provided and valid
        if (!registerType || (registerType !== 'email' && registerType !== 'phone')) {
            return res.json({ success: false, message: "Please specify whether you want to register with email or phone." });
        }

        // Validate the provided field based on registerType
        if (registerType === 'email') {
            if (!email) {
                return res.json({ success: false, message: "Email is required for registration." });
            }
            // Check if the email already exists
            const exists = await userModel.findOne({ email });
            if (exists) {
                return res.json({ success: false, message: "A user already exists with this email." });
            }
            // Validate email format
            if (!validator.isEmail(email)) {
                return res.json({ success: false, message: "Please enter a valid email." });
            }
        }

        if (registerType === 'phone') {
            if (!phone) {
                return res.json({ success: false, message: "Phone number is required for registration." });
            }
            // Check if the phone number already exists
            const exists = await userModel.findOne({ phone });
            if (exists) {
                return res.json({ success: false, message: "A user already exists with this phone number." });
            }
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password (at least 8 characters)." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new userModel({
            name,
            email: registerType === 'email' ? email : undefined,  // Only set email if registering via email
            phone: registerType === 'phone' ? phone : undefined,  // Only set phone if registering via phone
            password: hashedPassword,
            referal,
        });

        // Save user to the database
        const user = await newUser.save();

        // Generate token
        const token = createToken(user._id);

        // Return success response with token
        res.json({ success: true, message: "Registration successful", token });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { registerUser,loginUser };
