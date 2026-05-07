import mongoose from 'mongoose';

const institutionalAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Institution Information
    institutionName: {
      type: String,
      required: true,
    },
    institutionType: {
      type: String,
      enum: ['government', 'corporate', 'ngo', 'educational', 'healthcare', 'financial', 'other'],
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
    },
    taxId: String,
    businessLicense: String,

    // Official Details
    officialWebsite: String,
    officialEmail: {
      type: String,
      required: true,
    },
    officialPhone: String,
    officialAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'suspended'],
      default: 'unverified',
    },
    verificationLevel: {
      type: String,
      enum: ['level_0', 'level_1', 'level_2', 'level_3', 'level_4'],
      default: 'level_0',
    }, // level_0: unverified, level_4: fully verified institutional

    // Documents
    documents: [
      {
        documentId: mongoose.Schema.Types.ObjectId,
        documentType: {
          type: String,
          enum: ['business_license', 'registration_certificate', 'tax_id', 'government_id', 'corporate_seal', 'other'],
          required: true,
        },
        documentNumber: String,
        issuingDate: Date,
        expiryDate: Date,
        documentUrl: String,
        verificationStatus: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending',
        },
        verificationDate: Date,
        rejectionReason: String,
      },
    ],

    // Authorized Representatives
    authorizedRepresentatives: [
      {
        representativeId: mongoose.Schema.Types.ObjectId,
        name: String,
        title: String,
        email: String,
        phone: String,
        verificationStatus: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending',
        },
        permissions: [String], // e.g., 'manage_account', 'post_content', 'manage_team'
        addedAt: Date,
      },
    ],

    // Institutional Badge
    institutionalBadge: {
      type: Boolean,
      default: false,
    },
    badgeType: {
      type: String,
      enum: ['government', 'corporate', 'verified_institution', 'elite_institutional'],
      default: 'verified_institution',
    },
    badgeExpiryDate: Date,

    // Trust & Authority
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    authorityLevel: {
      type: String,
      enum: ['standard', 'high', 'critical'],
      default: 'standard',
    },
    publicTrustLabel: {
      type: Boolean,
      default: false,
    },

    // Subscription & Premium
    subscriptionStatus: {
      type: String,
      enum: ['free', 'premium', 'elite', 'enterprise'],
      default: 'free',
    },
    subscriptionExpiryDate: Date,
    isPremium: {
      type: Boolean,
      default: false,
    },

    // Security Settings
    multiLayerEncryption: {
      type: Boolean,
      default: true,
    },
    deviceLockEnabled: {
      type: Boolean,
      default: true,
    },
    twoFactorAuthEnabled: {
      type: Boolean,
      default: true,
    },
    ipWhitelist: [String],
    deviceFingerprints: [String],

    // Compliance
    complianceStatus: {
      type: String,
      enum: ['compliant', 'non_compliant', 'review_required', 'suspended'],
      default: 'review_required',
    },
    complianceNotes: String,
    lastComplianceCheck: Date,
    complianceChecklist: {
      kycCompleted: Boolean,
      documentsVerified: Boolean,
      representativesVerified: Boolean,
      termsAccepted: Boolean,
      privacyPolicyAccepted: Boolean,
    },

    // Dashboard & Features
    dashboardAccess: {
      type: Boolean,
      default: true,
    },
    advancedAnalytics: {
      type: Boolean,
      default: false,
    },
    customBranding: {
      type: Boolean,
      default: false,
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    secureMessaging: {
      type: Boolean,
      default: false,
    },
    officialContactSystem: {
      type: Boolean,
      default: false,
    },

    // Team Management
    teamMembers: [
      {
        memberId: mongoose.Schema.Types.ObjectId,
        name: String,
        email: String,
        role: String,
        permissions: [String],
        addedAt: Date,
        status: {
          type: String,
          enum: ['active', 'inactive', 'suspended'],
          default: 'active',
        },
      },
    ],

    // Activity Logging
    activityLog: [
      {
        date: Date,
        action: String,
        performedBy: String,
        details: String,
        ipAddress: String,
        deviceInfo: String,
      },
    ],

    // Audit Trail
    auditTrail: [
      {
        date: Date,
        action: String,
        changedBy: String,
        changes: {
          field: String,
          oldValue: String,
          newValue: String,
        },
      },
    ],

    // Suspension & Blocking
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: String,
    suspensionDate: Date,
    suspensionExpiry: Date,

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index
institutionalAccountSchema.index({ userId: 1 });
institutionalAccountSchema.index({ verificationStatus: 1 });
institutionalAccountSchema.index({ institutionType: 1 });
institutionalAccountSchema.index({ trustScore: -1 });

// Methods
institutionalAccountSchema.methods.isFullyVerified = function () {
  return this.verificationStatus === 'verified' && this.verificationLevel === 'level_4';
};

institutionalAccountSchema.methods.addRepresentative = function (representativeData) {
  this.authorizedRepresentatives.push({
    ...representativeData,
    representativeId: new mongoose.Types.ObjectId(),
    addedAt: new Date(),
  });
  return this.save();
};

institutionalAccountSchema.methods.addTeamMember = function (memberData) {
  this.teamMembers.push({
    ...memberData,
    memberId: new mongoose.Types.ObjectId(),
    addedAt: new Date(),
  });
  return this.save();
};

institutionalAccountSchema.methods.logActivity = function (action, performedBy, details, ipAddress, deviceInfo) {
  this.activityLog.push({
    date: new Date(),
    action,
    performedBy,
    details,
    ipAddress,
    deviceInfo,
  });

  if (this.activityLog.length > 1000) {
    this.activityLog.shift();
  }

  return this.save();
};

institutionalAccountSchema.methods.addAuditRecord = function (action, changedBy, changes) {
  this.auditTrail.push({
    date: new Date(),
    action,
    changedBy,
    changes,
  });

  if (this.auditTrail.length > 1000) {
    this.auditTrail.shift();
  }

  return this.save();
};

institutionalAccountSchema.methods.calculateTrustScore = function () {
  let score = 0;

  if (this.verificationStatus === 'verified') score += 30;
  if (this.documentsVerified) score += 20;
  if (this.representativesVerified) score += 20;
  if (this.twoFactorAuthEnabled) score += 10;
  if (this.multiLayerEncryption) score += 10;
  if (this.complianceStatus === 'compliant') score += 10;

  this.trustScore = Math.min(100, score);
  return this.trustScore;
};

institutionalAccountSchema.methods.suspendAccount = function (reason = '') {
  this.isSuspended = true;
  this.suspensionReason = reason;
  this.suspensionDate = new Date();
  this.complianceStatus = 'suspended';
  return this.save();
};

institutionalAccountSchema.methods.unsuspendAccount = function () {
  this.isSuspended = false;
  this.suspensionReason = null;
  this.suspensionDate = null;
  this.complianceStatus = 'compliant';
  return this.save();
};

export default mongoose.model('InstitutionalAccount', institutionalAccountSchema);
