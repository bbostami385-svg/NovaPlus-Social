import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  icon: String,
  unlockedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
