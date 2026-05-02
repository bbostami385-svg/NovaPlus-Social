import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: String,
  stock: { type: Number, default: 0 },
  category: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
