const User = require('../models/user.model');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "firstName lastName username email profileImage xpPoints badges"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_images" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const uploadResult = await streamUpload(req.file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { profileImage: uploadResult.secure_url },
      { new: true }
    );

    res.json({
      message: "Profile image updated successfully",
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { getUserProfile, uploadProfileImage };
