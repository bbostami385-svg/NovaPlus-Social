import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: String,
  description: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  icon: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
