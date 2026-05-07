import mongoose from 'mongoose';

const sponsorshipRequestSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sponsorName: {
      type: String,
      required: true,
    },
    sponsorLogo: String,
    sponsorCategory: {
      type: String,
      enum: ['sports_brand', 'nutrition', 'equipment', 'apparel', 'technology', 'energy_drink', 'other'],
      required: true,
    },

    // Deal Details
    dealTitle: {
      type: String,
      required: true,
    },
    dealDescription: String,
    dealType: {
      type: String,
      enum: ['endorsement', 'partnership', 'equipment_sponsorship', 'appearance_fee', 'equity_deal'],
      required: true,
    },

    // Financial Terms
    offerAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentSchedule: {
      type: String,
      enum: ['lump_sum', 'monthly', 'quarterly', 'milestone_based'],
      default: 'monthly',
    },
    paymentTerms: String,

    // Duration
    startDate: Date,
    endDate: Date,
    duration: {
      type: String,
      enum: ['3-months', '6-months', '1-year', '2-years', 'custom'],
      required: true,
    },

    // Requirements & Deliverables
    requirements: [
      {
        requirement: String,
        description: String,
        deliverable: String,
        frequency: String, // 'one-time', 'monthly', 'weekly'
      },
    ],
    minimumEngagement: {
      socialMediaPosts: Number,
      eventAppearances: Number,
      productUsage: String,
      otherRequirements: [String],
    },

    // Terms & Conditions
    exclusivityClause: {
      type: Boolean,
      default: false,
    },
    exclusiveCategories: [String],
    nonCompeteClause: {
      type: Boolean,
      default: false,
    },
    confidentialityClause: {
      type: Boolean,
      default: false,
    },
    terminationClause: String,
    otherTerms: [String],

    // Status
    status: {
      type: String,
      enum: ['pending', 'under_review', 'negotiation', 'accepted', 'rejected', 'expired', 'cancelled', 'completed'],
      default: 'pending',
    },
    athleteResponse: {
      type: String,
      enum: ['pending', 'interested', 'negotiating', 'accepted', 'rejected'],
      default: 'pending',
    },

    // Negotiation
    negotiationHistory: [
      {
        date: Date,
        proposedBy: String, // 'sponsor' or 'athlete'
        changes: {
          amount: Number,
          duration: String,
          requirements: [String],
          otherTerms: String,
        },
        message: String,
        status: String,
      },
    ],

    // Contract
    contractDocument: String, // URL to contract
    contractSignedDate: Date,
    contractStatus: {
      type: String,
      enum: ['pending', 'signed', 'executed', 'terminated'],
      default: 'pending',
    },

    // Performance Tracking
    performanceMetrics: {
      socialMediaReach: Number,
      engagementRate: Number,
      websiteTraffic: Number,
      conversionRate: Number,
      brandMentions: Number,
      sentimentScore: Number,
      lastUpdated: Date,
    },

    // Deliverables Tracking
    deliverables: [
      {
        deliverableId: mongoose.Schema.Types.ObjectId,
        deliverableName: String,
        dueDate: Date,
        completionDate: Date,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'delayed', 'failed'],
          default: 'pending',
        },
        description: String,
        proof: String, // URL to proof
      },
    ],

    // Payment Tracking
    payments: [
      {
        paymentId: mongoose.Schema.Types.ObjectId,
        amount: Number,
        dueDate: Date,
        paymentDate: Date,
        status: {
          type: String,
          enum: ['pending', 'paid', 'overdue', 'failed'],
          default: 'pending',
        },
        milestone: String,
      },
    ],

    // Communication
    messages: [
      {
        date: Date,
        sender: String, // 'sponsor' or 'athlete'
        message: String,
        attachments: [String],
      },
    ],

    // Feedback & Rating
    athleteFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      wouldWorkAgain: Boolean,
    },
    sponsorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      wouldRenew: Boolean,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

// Index
sponsorshipRequestSchema.index({ athleteId: 1 });
sponsorshipRequestSchema.index({ sponsorId: 1 });
sponsorshipRequestSchema.index({ status: 1 });
sponsorshipRequestSchema.index({ endDate: 1 });

// Methods
sponsorshipRequestSchema.methods.acceptOffer = function () {
  this.status = 'accepted';
  this.athleteResponse = 'accepted';
  return this.save();
};

sponsorshipRequestSchema.methods.rejectOffer = function (reason = '') {
  this.status = 'rejected';
  this.athleteResponse = 'rejected';
  return this.save();
};

sponsorshipRequestSchema.methods.proposeCounterOffer = function (counterData) {
  this.negotiationHistory.push({
    date: new Date(),
    proposedBy: 'athlete',
    changes: counterData,
    status: 'pending',
  });
  this.status = 'negotiation';
  this.athleteResponse = 'negotiating';
  return this.save();
};

sponsorshipRequestSchema.methods.signContract = function () {
  this.contractSignedDate = new Date();
  this.contractStatus = 'signed';
  this.status = 'accepted';
  return this.save();
};

sponsorshipRequestSchema.methods.addDeliverable = function (deliverableData) {
  this.deliverables.push({
    ...deliverableData,
    deliverableId: new mongoose.Types.ObjectId(),
  });
  return this.save();
};

sponsorshipRequestSchema.methods.completeDeliverable = function (deliverableId, proof) {
  const deliverable = this.deliverables.find((d) => d.deliverableId.toString() === deliverableId.toString());
  if (deliverable) {
    deliverable.status = 'completed';
    deliverable.completionDate = new Date();
    deliverable.proof = proof;
  }
  return this.save();
};

sponsorshipRequestSchema.methods.recordPayment = function (paymentData) {
  this.payments.push({
    ...paymentData,
    paymentId: new mongoose.Types.ObjectId(),
    paymentDate: new Date(),
    status: 'paid',
  });
  return this.save();
};

sponsorshipRequestSchema.methods.addMessage = function (sender, message, attachments = []) {
  this.messages.push({
    date: new Date(),
    sender,
    message,
    attachments,
  });
  return this.save();
};

sponsorshipRequestSchema.methods.submitFeedback = function (feedbackData, feedbackType = 'athlete') {
  if (feedbackType === 'athlete') {
    this.athleteFeedback = feedbackData;
  } else if (feedbackType === 'sponsor') {
    this.sponsorFeedback = feedbackData;
  }
  return this.save();
};

sponsorshipRequestSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === 'accepted' && this.startDate <= now && this.endDate >= now;
};

sponsorshipRequestSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

export default mongoose.model('SponsorshipRequest', sponsorshipRequestSchema);
