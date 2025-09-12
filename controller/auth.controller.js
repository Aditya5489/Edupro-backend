const User = require('../models/user.model.js');
const jwt =require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const signup = async (req, res) => {
  try {
    const { firstName,lastName, email,username, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const newUser = new User({ firstName, lastName, email,username, password });
    await newUser.save();

    const token = generateToken(newUser);

     res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure:false,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ token,
         message: "User registered successfully"
        , user: { id: newUser._id, firstName: newUser.firstName,lastName: newUser.lastName, email: newUser.email,username:newUser.username } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user);

     res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.status(200).json({ token, message: "User logged in successfully",user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.json({ message: "Logged out successfully" });
};

module.exports = {
  signup,
  login,
  logout
};