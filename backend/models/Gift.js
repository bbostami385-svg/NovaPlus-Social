import mongoose from 'mongoose';

const giftSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  price: Number,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Gift', giftSchema);
