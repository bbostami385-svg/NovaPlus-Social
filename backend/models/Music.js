import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
  title: String,
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  audioUrl: String,
  duration: Number,
  genre: String,
  plays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Music', musicSchema);
