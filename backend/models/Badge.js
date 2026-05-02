import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  criteria: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Badge', badgeSchema);
