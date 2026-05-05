import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * @route   POST /api/products/create
 * @desc    Create a new product
 * @access  Private
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, description, price, category, images = [], stock = 0, tags = [] } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    const product = new Product({
      seller: req.userId,
      name,
      description,
      price,
      category,
      images,
      stock,
      tags,
    });

    await product.save();

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'firstName lastName profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products/:productId
 * @desc    Get product details
 * @access  Public
 */
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('seller', 'firstName lastName profilePicture')
      .populate('reviews.reviewer', 'firstName lastName profilePicture');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/products/:productId
 * @desc    Update product
 * @access  Private
 */
router.put('/:productId', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this product',
      });
    }

    const { name, description, price, category, images, stock, tags } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (images) product.images = images;
    if (stock !== undefined) product.stock = stock;
    if (tags) product.tags = tags;

    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/products/:productId/review
 * @desc    Add review to product
 * @access  Private
 */
router.post('/:productId/review', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.reviews.push({
      reviewer: req.userId,
      rating,
      comment,
      createdAt: new Date(),
    });

    // Update average rating
    const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
    product.averageRating = avgRating;

    await product.save();

    res.status(201).json({
      success: true,
      review: product.reviews[product.reviews.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/products/:productId
 * @desc    Delete product
 * @access  Private
 */
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this product',
      });
    }

    await Product.findByIdAndDelete(req.params.productId);

    res.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

export default router;
