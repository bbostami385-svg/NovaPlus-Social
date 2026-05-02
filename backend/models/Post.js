import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  image: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
