const mongoose =require("mongoose");
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    username: {
       type: String,
       required: true,
       unique: true
    },
    profileImage: {
      type: String, 
      default:"https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png",
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    xpPoints: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        type: String, 
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;

