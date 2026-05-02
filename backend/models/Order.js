import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: String,
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{ productId: mongoose.Schema.Types.ObjectId, quantity: Number, price: Number }],
  total: Number,
  status: { type: String, default: 'pending' },
  shippingAddress: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
