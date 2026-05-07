import mongoose from 'mongoose';

const hiringRequestSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
    },
    hiringOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    organizationLogo: String,
    organizationType: {
      type: String,
      enum: ['club', 'academy', 'franchise', 'national_team', 'scout', 'coach', 'other'],
      required: true,
    },

    // Position Details
    positionTitle: {
      type: String,
      required: true,
    },
    positionDescription: String,
    role: {
      type: String,
      enum: ['player', 'coach', 'analyst', 'trainer', 'manager', 'scout', 'other'],
      required: true,
    },
    level: {
      type: String,
      enum: ['academy', 'state', 'national', 'international', 'franchise'],
      required: true,
    },

    // Employment Details
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance'],
      required: true,
    },
    contractDuration: {
      type: String,
      enum: ['3-months', '6-months', '1-year', '2-years', '3-years', 'open-ended'],
      default: '1-year',
    },
    startDate: Date,
    endDate: Date,

    // Compensation
    salary: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    salaryFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
    },
    additionalBenefits: [
      {
        benefit: String,
        value: String,
      },
    ],
    performanceBonus: {
      type: Number,
      default: 0,
    },
    bonusConditions: String,

    // Requirements
    requirements: [
      {
        requirement: String,
        description: String,
        mandatory: Boolean,
      },
    ],
    minimumSkillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional', 'international'],
      default: 'intermediate',
    },
    preferredStats: {
      battingAverage: Number,
      bowlingAverage: Number,
      fitnessScore: Number,
      otherMetrics: [String],
    },
    experienceRequired: {
      type: Number,
      default: 0,
    }, // years

    // Location
    location: {
      city: String,
      state: String,
      country: String,
      accommodationProvided: Boolean,
      travelAllowance: Number,
    },

    // Responsibilities
    responsibilities: [String],
    workingHours: String,
    reportingTo: String,

    // Status
    status: {
      type: String,
      enum: ['open', 'under_review', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected', 'filled', 'closed'],
      default: 'open',
    },
    athleteResponse: {
      type: String,
      enum: ['pending', 'interested', 'applied', 'interviewing', 'accepted', 'rejected'],
      default: 'pending',
    },

    // Application Tracking
    applicants: [
      {
        athleteId: mongoose.Schema.Types.ObjectId,
        athleteName: String,
        athleteRating: Number,
        applicationDate: Date,
        status: {
          type: String,
          enum: ['applied', 'shortlisted', 'interview', 'rejected', 'accepted'],
          default: 'applied',
        },
        notes: String,
      },
    ],

    // Interview Process
    interviewRounds: [
      {
        roundNumber: Number,
        roundName: String,
        roundDescription: String,
        interviewDate: Date,
        interviewer: String,
        result: {
          type: String,
          enum: ['pending', 'passed', 'failed'],
          default: 'pending',
        },
        feedback: String,
        score: Number,
      },
    ],

    // Offer Details
    offerDetails: {
      offerDate: Date,
      offerExpiryDate: Date,
      offerStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending',
      },
      offerLetter: String, // URL
      terms: String,
    },

    // Contract
    contractDocument: String, // URL
    contractSignedDate: Date,
    contractStatus: {
      type: String,
      enum: ['pending', 'signed', 'executed', 'terminated'],
      default: 'pending',
    },

    // Communication
    messages: [
      {
        date: Date,
        sender: String, // 'organization' or 'athlete'
        message: String,
        attachments: [String],
      },
    ],

    // Performance Tracking (After Hiring)
    performanceReview: {
      reviewDate: Date,
      reviewer: String,
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
      improvements: [String],
      renewalRecommendation: Boolean,
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
    postedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index
hiringRequestSchema.index({ athleteId: 1 });
hiringRequestSchema.index({ hiringOrganizationId: 1 });
hiringRequestSchema.index({ status: 1 });
hiringRequestSchema.index({ level: 1 });
hiringRequestSchema.index({ role: 1 });

// Methods
hiringRequestSchema.methods.applyForPosition = function (athleteData) {
  this.applicants.push({
    athleteId: athleteData.athleteId,
    athleteName: athleteData.athleteName,
    athleteRating: athleteData.athleteRating,
    applicationDate: new Date(),
    status: 'applied',
  });
  this.athleteResponse = 'applied';
  return this.save();
};

hiringRequestSchema.methods.shortlistApplicant = function (athleteId) {
  const applicant = this.applicants.find((a) => a.athleteId.toString() === athleteId.toString());
  if (applicant) {
    applicant.status = 'shortlisted';
  }
  return this.save();
};

hiringRequestSchema.methods.scheduleInterview = function (athleteId, interviewData) {
  const applicant = this.applicants.find((a) => a.athleteId.toString() === athleteId.toString());
  if (applicant) {
    applicant.status = 'interview';
  }

  this.interviewRounds.push({
    roundNumber: this.interviewRounds.length + 1,
    ...interviewData,
    roundDate: new Date(),
  });

  this.status = 'interview';
  return this.save();
};

hiringRequestSchema.methods.recordInterviewResult = function (roundNumber, result, feedback, score) {
  const round = this.interviewRounds.find((r) => r.roundNumber === roundNumber);
  if (round) {
    round.result = result;
    round.feedback = feedback;
    round.score = score;
  }
  return this.save();
};

hiringRequestSchema.methods.makeOffer = function (athleteId, offerData) {
  const applicant = this.applicants.find((a) => a.athleteId.toString() === athleteId.toString());
  if (applicant) {
    applicant.status = 'accepted';
  }

  this.offerDetails = {
    ...offerData,
    offerDate: new Date(),
    offerStatus: 'pending',
  };

  this.status = 'offer';
  this.athleteResponse = 'accepted';
  return this.save();
};

hiringRequestSchema.methods.acceptOffer = function () {
  this.offerDetails.offerStatus = 'accepted';
  this.status = 'accepted';
  this.athleteResponse = 'accepted';
  return this.save();
};

hiringRequestSchema.methods.rejectOffer = function () {
  this.offerDetails.offerStatus = 'rejected';
  this.status = 'rejected';
  this.athleteResponse = 'rejected';
  return this.save();
};

hiringRequestSchema.methods.signContract = function () {
  this.contractSignedDate = new Date();
  this.contractStatus = 'signed';
  this.status = 'accepted';
  return this.save();
};

hiringRequestSchema.methods.addMessage = function (sender, message, attachments = []) {
  this.messages.push({
    date: new Date(),
    sender,
    message,
    attachments,
  });
  return this.save();
};

hiringRequestSchema.methods.submitPerformanceReview = function (reviewData) {
  this.performanceReview = {
    ...reviewData,
    reviewDate: new Date(),
  };
  return this.save();
};

hiringRequestSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === 'accepted' && this.startDate <= now && this.endDate >= now;
};

hiringRequestSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

export default mongoose.model('HiringRequest', hiringRequestSchema);
