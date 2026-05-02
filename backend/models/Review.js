import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
