import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountType: {
      type: String,
      enum: ['standard', 'institutional', 'vip'],
      required: true,
    },

    // Activity Information
    action: {
      type: String,
      required: true,
    }, // e.g., 'profile_update', 'login', 'document_upload', 'payment'
    actionCategory: {
      type: String,
      enum: ['authentication', 'profile', 'content', 'payment', 'security', 'compliance', 'admin', 'other'],
      required: true,
    },
    actionStatus: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
    },

    // Details
    description: String,
    details: mongoose.Schema.Types.Mixed, // Can store any details

    // Actor Information
    performedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String, // 'user', 'admin', 'system'
      userName: String,
      userEmail: String,
    },

    // Device & Location Information
    deviceInfo: {
      deviceType: String,
      osType: String,
      osVersion: String,
      browserType: String,
      browserVersion: String,
      deviceFingerprint: String,
    },
    ipAddress: String,
    geoLocation: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },

    // Changes Made (For update actions)
    changes: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],

    // Related Resources
    relatedResources: [
      {
        resourceType: String,
        resourceId: mongoose.Schema.Types.ObjectId,
        resourceName: String,
      },
    ],

    // Impact Assessment
    impactLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    affectedSystems: [String],

    // Security Information
    securityFlags: [String], // e.g., 'unusual_location', 'new_device', 'failed_auth'
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Compliance Information
    complianceRelevant: {
      type: Boolean,
      default: false,
    },
    complianceNotes: String,
    regulatoryCategory: String,

    // Retention
    retentionPolicy: {
      type: String,
      enum: ['standard', 'extended', 'permanent'],
      default: 'standard',
    },
    retentionExpiryDate: Date,

    // Metadata
    timestamp: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Index
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actionCategory: 1 });
auditLogSchema.index({ accountType: 1 });
auditLogSchema.index({ actionStatus: 1 });
auditLogSchema.index({ 'performedBy.userId': 1 });
auditLogSchema.index({ ipAddress: 1 });

// TTL Index for automatic deletion based on retention policy
auditLogSchema.index({ retentionExpiryDate: 1 }, { expireAfterSeconds: 0 });

// Methods
auditLogSchema.methods.flagAsHighRisk = function () {
  this.impactLevel = 'high';
  this.riskScore = 75;
  this.securityFlags.push('high_risk_activity');
  return this.save();
};

auditLogSchema.methods.markAsComplianceRelevant = function (category, notes = '') {
  this.complianceRelevant = true;
  this.regulatoryCategory = category;
  this.complianceNotes = notes;
  return this.save();
};

auditLogSchema.methods.setRetentionPolicy = function (policy, expiryDate) {
  this.retentionPolicy = policy;
  this.retentionExpiryDate = expiryDate;
  return this.save();
};

auditLogSchema.statics.logActivity = function (auditData) {
  return this.create({
    ...auditData,
    timestamp: new Date(),
  });
};

auditLogSchema.statics.getActivityHistory = function (userId, limit = 100) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

auditLogSchema.statics.getActivitiesByCategory = function (userId, category, limit = 50) {
  return this.find({ userId, actionCategory: category })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

auditLogSchema.statics.getHighRiskActivities = function (userId) {
  return this.find({
    userId,
    impactLevel: { $in: ['high', 'critical'] },
  })
    .sort({ timestamp: -1 })
    .exec();
};

export default mongoose.model('AuditLog', auditLogSchema);
