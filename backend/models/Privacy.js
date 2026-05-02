import mongoose from 'mongoose';

const privacySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  profileVisibility: { type: String, default: 'public' },
  allowMessages: { type: Boolean, default: true },
  allowComments: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Privacy', privacySchema);
