import mongoose from 'mongoose';

const hashtagSchema = new mongoose.Schema({
  tag: { type: String, unique: true },
  count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Hashtag', hashtagSchema);
