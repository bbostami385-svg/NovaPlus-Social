import Sponsorship from '../models/Sponsorship.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

class SponsorshipService {
  // Get all sponsorships
  static async getAllSponsorships(filter = {}) {
    try {
      const sponsorships = await Sponsorship.find(filter)
        .populate('creator', 'firstName lastName profilePicture')
        .populate('brand', 'name logo')
        .sort({ createdAt: -1 });

      return sponsorships;
    } catch (error) {
      throw new Error(`Failed to fetch sponsorships: ${error.message}`);
    }
  }

  // Get sponsorship by ID
  static async getSponsorshipById(sponsorshipId) {
    try {
      const sponsorship = await Sponsorship.findById(sponsorshipId)
        .populate('creator', 'firstName lastName profilePicture')
        .populate('brand', 'name logo');

      if (!sponsorship) {
        throw new Error('Sponsorship not found');
      }

      return sponsorship;
    } catch (error) {
      throw new Error(`Failed to fetch sponsorship: ${error.message}`);
    }
  }

  // Get creator's sponsorships
  static async getCreatorSponsorships(creatorId) {
    try {
      const sponsorships = await Sponsorship.find({ creator: creatorId })
        .populate('brand', 'name logo')
        .sort({ createdAt: -1 });

      return sponsorships;
    } catch (error) {
      throw new Error(`Failed to fetch creator sponsorships: ${error.message}`);
    }
  }

  // Get brand sponsorships
  static async getBrandSponsorships(brandId) {
    try {
      const sponsorships = await Sponsorship.find({ brand: brandId })
        .populate('creator', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 });

      return sponsorships;
    } catch (error) {
      throw new Error(`Failed to fetch brand sponsorships: ${error.message}`);
    }
  }

  // Create sponsorship offer
  static async createSponsorshipOffer(offerData) {
    try {
      const sponsorship = new Sponsorship(offerData);
      await sponsorship.save();

      // Notify creator
      await Notification.create({
        userId: offerData.creator,
        type: 'sponsorship_offer',
        title: 'New Sponsorship Offer',
        message: `You received a sponsorship offer: ${offerData.title}`,
        relatedSponsorship: sponsorship._id,
        read: false,
      });

      return sponsorship;
    } catch (error) {
      throw new Error(`Failed to create sponsorship offer: ${error.message}`);
    }
  }

  // Accept sponsorship
  static async acceptSponsorship(sponsorshipId, creatorId) {
    try {
      const sponsorship = await Sponsorship.findById(sponsorshipId);
      if (!sponsorship) {
        throw new Error('Sponsorship not found');
      }

      if (sponsorship.creator.toString() !== creatorId) {
        throw new Error('Unauthorized to accept this sponsorship');
      }

      sponsorship.status = 'accepted';
      sponsorship.acceptedAt = new Date();
      await sponsorship.save();

      // Add earnings to creator
      const creator = await User.findById(creatorId);
      if (creator) {
        creator.totalEarnings = (creator.totalEarnings || 0) + sponsorship.amount;
        creator.coins = (creator.coins || 0) + sponsorship.amount;
        await creator.save();
      }

      // Notify brand
      await Notification.create({
        userId: sponsorship.brand,
        type: 'sponsorship_accepted',
        title: 'Sponsorship Accepted',
        message: `Your sponsorship offer was accepted by ${creator?.firstName}`,
        relatedSponsorship: sponsorshipId,
        read: false,
      });

      return sponsorship;
    } catch (error) {
      throw new Error(`Failed to accept sponsorship: ${error.message}`);
    }
  }

  // Decline sponsorship
  static async declineSponsorship(sponsorshipId, creatorId) {
    try {
      const sponsorship = await Sponsorship.findById(sponsorshipId);
      if (!sponsorship) {
        throw new Error('Sponsorship not found');
      }

      if (sponsorship.creator.toString() !== creatorId) {
        throw new Error('Unauthorized to decline this sponsorship');
      }

      sponsorship.status = 'declined';
      sponsorship.declinedAt = new Date();
      await sponsorship.save();

      return sponsorship;
    } catch (error) {
      throw new Error(`Failed to decline sponsorship: ${error.message}`);
    }
  }

  // Complete sponsorship
  static async completeSponsorship(sponsorshipId) {
    try {
      const sponsorship = await Sponsorship.findById(sponsorshipId);
      if (!sponsorship) {
        throw new Error('Sponsorship not found');
      }

      sponsorship.status = 'completed';
      sponsorship.completedAt = new Date();
      await sponsorship.save();

      return sponsorship;
    } catch (error) {
      throw new Error(`Failed to complete sponsorship: ${error.message}`);
    }
  }

  // Get sponsorship statistics
  static async getSponsorshipStats(creatorId) {
    try {
      const sponsorships = await Sponsorship.find({ creator: creatorId });

      const stats = {
        totalOffers: sponsorships.length,
        acceptedOffers: sponsorships.filter((s) => s.status === 'accepted').length,
        declinedOffers: sponsorships.filter((s) => s.status === 'declined').length,
        completedOffers: sponsorships.filter((s) => s.status === 'completed').length,
        totalEarnings: sponsorships.reduce((sum, s) => {
          return s.status === 'accepted' || s.status === 'completed' ? sum + s.amount : sum;
        }, 0),
        pendingOffers: sponsorships.filter((s) => s.status === 'pending').length,
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch sponsorship stats: ${error.message}`);
    }
  }

  // Get trending sponsorships
  static async getTrendingSponsorships(limit = 10) {
    try {
      const sponsorships = await Sponsorship.find({ status: 'accepted' })
        .populate('creator', 'firstName lastName profilePicture')
        .populate('brand', 'name logo')
        .sort({ acceptedAt: -1 })
        .limit(limit);

      return sponsorships;
    } catch (error) {
      throw new Error(`Failed to fetch trending sponsorships: ${error.message}`);
    }
  }

  // Search sponsorships
  static async searchSponsorships(query) {
    try {
      const sponsorships = await Sponsorship.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
        .populate('creator', 'firstName lastName profilePicture')
        .populate('brand', 'name logo');

      return sponsorships;
    } catch (error) {
      throw new Error(`Failed to search sponsorships: ${error.message}`);
    }
  }

  // Get sponsorship opportunities for creator
  static async getSponsorshipOpportunities(creatorId, limit = 20) {
    try {
      const creator = await User.findById(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }

      // Find sponsorships that match creator's niche
      const opportunities = await Sponsorship.find({
        status: 'pending',
        targetNiche: { $in: creator.niches || [] },
      })
        .populate('brand', 'name logo')
        .sort({ createdAt: -1 })
        .limit(limit);

      return opportunities;
    } catch (error) {
      throw new Error(`Failed to fetch sponsorship opportunities: ${error.message}`);
    }
  }

  // Update sponsorship
  static async updateSponsorship(sponsorshipId, updateData) {
    try {
      const sponsorship = await Sponsorship.findByIdAndUpdate(sponsorshipId, updateData, {
        new: true,
      });

      if (!sponsorship) {
        throw new Error('Sponsorship not found');
      }

      return sponsorship;
    } catch (error) {
      throw new Error(`Failed to update sponsorship: ${error.message}`);
    }
  }

  // Delete sponsorship
  static async deleteSponsorship(sponsorshipId) {
    try {
      const sponsorship = await Sponsorship.findByIdAndDelete(sponsorshipId);
      if (!sponsorship) {
        throw new Error('Sponsorship not found');
      }

      return { success: true, message: 'Sponsorship deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete sponsorship: ${error.message}`);
    }
  }
}

export default SponsorshipService;
