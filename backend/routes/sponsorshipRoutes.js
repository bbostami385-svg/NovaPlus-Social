import express from 'express';
import SponsorshipService from '../services/SponsorshipService.js';
import { verifyFirebaseAuth, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// ==================== SPONSORSHIPS ====================

// Get all sponsorships
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const sponsorships = await SponsorshipService.getAllSponsorships(filter);
    res.status(200).json({
      success: true,
      data: sponsorships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get sponsorship by ID
router.get('/:sponsorshipId', async (req, res) => {
  try {
    const sponsorship = await SponsorshipService.getSponsorshipById(req.params.sponsorshipId);
    res.status(200).json({
      success: true,
      data: sponsorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get creator's sponsorships
router.get('/creator/:creatorId', async (req, res) => {
  try {
    const sponsorships = await SponsorshipService.getCreatorSponsorships(req.params.creatorId);
    res.status(200).json({
      success: true,
      data: sponsorships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get brand sponsorships
router.get('/brand/:brandId', async (req, res) => {
  try {
    const sponsorships = await SponsorshipService.getBrandSponsorships(req.params.brandId);
    res.status(200).json({
      success: true,
      data: sponsorships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Create sponsorship offer
router.post('/create', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { title, description, amount, duration, targetNiche, creator, brand } = req.body;

    if (!title || !amount || !creator || !brand) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, creator, and brand are required',
      });
    }

    const sponsorship = await SponsorshipService.createSponsorshipOffer({
      title,
      description,
      amount,
      duration,
      targetNiche,
      creator,
      brand,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: sponsorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Accept sponsorship
router.post('/:sponsorshipId/accept', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const sponsorship = await SponsorshipService.acceptSponsorship(
      req.params.sponsorshipId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Sponsorship accepted successfully',
      data: sponsorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Decline sponsorship
router.post('/:sponsorshipId/decline', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const sponsorship = await SponsorshipService.declineSponsorship(
      req.params.sponsorshipId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Sponsorship declined successfully',
      data: sponsorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Complete sponsorship
router.post('/:sponsorshipId/complete', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const sponsorship = await SponsorshipService.completeSponsorship(req.params.sponsorshipId);

    res.status(200).json({
      success: true,
      message: 'Sponsorship completed successfully',
      data: sponsorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get sponsorship statistics
router.get('/stats/:creatorId', async (req, res) => {
  try {
    const stats = await SponsorshipService.getSponsorshipStats(req.params.creatorId);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get trending sponsorships
router.get('/trending/all', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const sponsorships = await SponsorshipService.getTrendingSponsorships(limit);
    res.status(200).json({
      success: true,
      data: sponsorships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Search sponsorships
router.get('/search/:query', async (req, res) => {
  try {
    const sponsorships = await SponsorshipService.searchSponsorships(req.params.query);
    res.status(200).json({
      success: true,
      data: sponsorships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get sponsorship opportunities
router.get('/opportunities/:creatorId', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const opportunities = await SponsorshipService.getSponsorshipOpportunities(
      req.params.creatorId,
      limit
    );

    res.status(200).json({
      success: true,
      data: opportunities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
