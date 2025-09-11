const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    resources: [{ type: String }],
    youtube: [{ type: String }],
    completed: { type: Boolean, default: false }
  },
  { _id: false }
);

const dayPlanSchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    tasks: [taskSchema],
    milestone: { type: String },
    motivationTip: { type: String }
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studyGoal: { 
      type: String,
      required: true
    },
    timePerDay: { 
      type: Number,
      required: true
    },
    skillLevel: {
      type: String,
      required: true
    },
    durationInDays: { 
      type: Number,
      required: true
    },
    plan: [dayPlanSchema],
    completed: { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
