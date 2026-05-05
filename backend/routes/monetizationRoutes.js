import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Monetization from '../models/Monetization.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/monetization/enable
 * @desc    Enable monetization for creator
 * @access  Private
 */
router.post('/enable', authenticate, async (req, res) => {
  try {
    const { bankAccount, taxId, paypalEmail } = req.body;

    if (!bankAccount && !paypalEmail) {
      return res.status(400).json({
        success: false,
        message: 'Bank account or PayPal email is required',
      });
    }

    let monetization = await Monetization.findOne({ creator: req.userId });

    if (!monetization) {
      monetization = new Monetization({
        creator: req.userId,
        bankAccount,
        taxId,
        paypalEmail,
        status: 'pending',
      });
    } else {
      monetization.bankAccount = bankAccount || monetization.bankAccount;
      monetization.taxId = taxId || monetization.taxId;
      monetization.paypalEmail = paypalEmail || monetization.paypalEmail;
    }

    await monetization.save();

    res.json({
      success: true,
      monetization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable monetization',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/monetization/earnings
 * @desc    Get creator earnings
 * @access  Private
 */
router.get('/earnings', authenticate, async (req, res) => {
  try {
    const monetization = await Monetization.findOne({ creator: req.userId });

    if (!monetization) {
      return res.status(404).json({
        success: false,
        message: 'Monetization not enabled',
      });
    }

    res.json({
      success: true,
      earnings: {
        totalEarnings: monetization.totalEarnings,
        pendingEarnings: monetization.pendingEarnings,
        paidEarnings: monetization.paidEarnings,
        lastPayment: monetization.lastPayment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/monetization/withdraw
 * @desc    Request withdrawal
 * @access  Private
 */
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const monetization = await Monetization.findOne({ creator: req.userId });

    if (!monetization) {
      return res.status(404).json({
        success: false,
        message: 'Monetization not enabled',
      });
    }

    if (monetization.pendingEarnings < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient pending earnings',
      });
    }

    monetization.withdrawals.push({
      amount,
      status: 'pending',
      requestedAt: new Date(),
    });

    monetization.pendingEarnings -= amount;
    await monetization.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawal: monetization.withdrawals[monetization.withdrawals.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message,
    });
  }
});

export default router;
