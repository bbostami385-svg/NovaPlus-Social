import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  name: String,
  nativeName: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Language', languageSchema);
