import mongoose from 'mongoose';

const identityVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
    },

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'suspended'],
      default: 'unverified',
    },
    verificationLevel: {
      type: String,
      enum: ['level_0', 'level_1', 'level_2', 'level_3'],
      default: 'level_0',
    }, // level_0: unverified, level_1: email verified, level_2: document verified, level_3: fully verified

    // Personal Information
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    nationality: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    // Document Verification
    documents: [
      {
        documentId: mongoose.Schema.Types.ObjectId,
        documentType: {
          type: String,
          enum: ['passport', 'national_id', 'driving_license', 'voter_id', 'aadhar', 'pan', 'other'],
          required: true,
        },
        documentNumber: String,
        issuingCountry: String,
        issuingDate: Date,
        expiryDate: Date,
        frontImage: String, // URL
        backImage: String, // URL
        verificationStatus: {
          type: String,
          enum: ['pending', 'verified', 'rejected', 'expired'],
          default: 'pending',
        },
        verificationDate: Date,
        rejectionReason: String,
        ocrData: {
          extractedName: String,
          extractedDOB: Date,
          extractedNumber: String,
          confidence: Number,
        },
        uploadedAt: Date,
      },
    ],

    // Liveness Detection
    livenessVerification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending',
      },
      videoUrl: String,
      verificationDate: Date,
      livenessScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      faceMatchScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      maxAttempts: {
        type: Number,
        default: 3,
      },
      failureReason: String,
    },

    // Face Recognition
    faceRecognition: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending',
      },
      faceEmbedding: String, // Encrypted face embedding
      faceImageUrl: String,
      verificationDate: Date,
      matchScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      failureReason: String,
    },

    // Email Verification
    emailVerification: {
      email: String,
      status: {
        type: String,
        enum: ['unverified', 'verified', 'failed'],
        default: 'unverified',
      },
      verificationToken: String,
      verificationDate: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },

    // Phone Verification
    phoneVerification: {
      phone: String,
      status: {
        type: String,
        enum: ['unverified', 'verified', 'failed'],
        default: 'unverified',
      },
      verificationCode: String,
      verificationDate: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },

    // Biometric Data
    biometricData: {
      fingerprint: String, // Encrypted
      iris: String, // Encrypted
      voiceprint: String, // Encrypted
      lastUpdated: Date,
    },

    // Verification History
    verificationHistory: [
      {
        date: Date,
        verificationMethod: String, // 'document', 'liveness', 'face_recognition', 'email', 'phone'
        status: String,
        result: String,
        verifiedBy: String, // 'system' or user id
        notes: String,
      },
    ],

    // Risk Assessment
    riskAssessment: {
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
      },
      riskFactors: [String],
      lastAssessmentDate: Date,
      flaggedForReview: {
        type: Boolean,
        default: false,
      },
      reviewNotes: String,
    },

    // Device & Location
    deviceFingerprint: String,
    ipAddress: String,
    geoLocation: {
      latitude: Number,
      longitude: Number,
      country: String,
      city: String,
    },
    deviceInfo: {
      deviceType: String,
      osType: String,
      osVersion: String,
      browserType: String,
    },

    // Verification Badges
    verifiedBadge: {
      type: Boolean,
      default: false,
    },
    badgeType: {
      type: String,
      enum: ['standard', 'premium', 'elite', 'celebrity'],
      default: 'standard',
    },
    badgeExpiryDate: Date,

    // Metadata
    verificationStartDate: Date,
    verificationCompletionDate: Date,
    verificationDuration: Number, // in minutes
    verificationMethod: [String], // ['document', 'liveness', 'face_recognition']
    verificationProvider: String, // e.g., 'stripe', 'jumio', 'onfido'
    externalVerificationId: String,

    // Compliance
    complianceStatus: {
      type: String,
      enum: ['compliant', 'non_compliant', 'review_required'],
      default: 'review_required',
    },
    complianceNotes: String,
    lastComplianceCheck: Date,

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
identityVerificationSchema.index({ userId: 1 });
identityVerificationSchema.index({ verificationStatus: 1 });
identityVerificationSchema.index({ verificationLevel: 1 });
identityVerificationSchema.index({ riskAssessment: { riskScore: -1 } });

// Methods
identityVerificationSchema.methods.isFullyVerified = function () {
  return this.verificationStatus === 'verified' && this.verificationLevel === 'level_3';
};

identityVerificationSchema.methods.isVerified = function () {
  return this.verificationStatus === 'verified';
};

identityVerificationSchema.methods.addVerificationRecord = function (verificationData) {
  this.verificationHistory.push({
    ...verificationData,
    date: new Date(),
  });
  return this.save();
};

identityVerificationSchema.methods.updateDocumentStatus = function (documentId, status, reason = '') {
  const document = this.documents.find((d) => d.documentId.toString() === documentId.toString());
  if (document) {
    document.verificationStatus = status;
    document.verificationDate = new Date();
    if (reason) {
      document.rejectionReason = reason;
    }
  }
  return this.save();
};

identityVerificationSchema.methods.updateLivenessStatus = function (status, livenessScore, faceMatchScore, reason = '') {
  this.livenessVerification.status = status;
  this.livenessVerification.verificationDate = new Date();
  this.livenessVerification.livenessScore = livenessScore;
  this.livenessVerification.faceMatchScore = faceMatchScore;
  if (reason) {
    this.livenessVerification.failureReason = reason;
  }
  this.livenessVerification.attempts += 1;
  return this.save();
};

identityVerificationSchema.methods.calculateRiskScore = function () {
  let riskScore = 0;
  const riskFactors = [];

  // Check document verification
  if (this.documents.length === 0) {
    riskScore += 30;
    riskFactors.push('No documents uploaded');
  } else if (this.documents.some((d) => d.verificationStatus === 'rejected')) {
    riskScore += 40;
    riskFactors.push('Document verification failed');
  }

  // Check liveness verification
  if (this.livenessVerification.status === 'failed') {
    riskScore += 35;
    riskFactors.push('Liveness verification failed');
  } else if (this.livenessVerification.livenessScore < 70) {
    riskScore += 20;
    riskFactors.push('Low liveness score');
  }

  // Check face recognition
  if (this.faceRecognition.matchScore < 80) {
    riskScore += 15;
    riskFactors.push('Face match score below threshold');
  }

  // Check device consistency
  if (this.deviceFingerprint && this.ipAddress) {
    // Additional checks can be added here
  }

  this.riskAssessment.riskScore = Math.min(100, riskScore);
  this.riskAssessment.riskFactors = riskFactors;

  if (this.riskAssessment.riskScore < 30) {
    this.riskAssessment.riskLevel = 'low';
  } else if (this.riskAssessment.riskScore < 60) {
    this.riskAssessment.riskLevel = 'medium';
  } else if (this.riskAssessment.riskScore < 85) {
    this.riskAssessment.riskLevel = 'high';
  } else {
    this.riskAssessment.riskLevel = 'critical';
  }

  this.riskAssessment.lastAssessmentDate = new Date();
  return this.riskAssessment;
};

identityVerificationSchema.methods.completeVerification = function () {
  if (this.isFullyVerified()) {
    this.verificationStatus = 'verified';
    this.verificationLevel = 'level_3';
    this.verificationCompletionDate = new Date();
    this.verifiedBadge = true;
    this.calculateRiskScore();
    return this.save();
  }
  return Promise.reject(new Error('Verification not complete'));
};

identityVerificationSchema.methods.suspendAccount = function (reason = '') {
  this.isSuspended = true;
  this.suspensionReason = reason;
  this.suspensionDate = new Date();
  return this.save();
};

identityVerificationSchema.methods.unsuspendAccount = function () {
  this.isSuspended = false;
  this.suspensionReason = null;
  this.suspensionDate = null;
  return this.save();
};

export default mongoose.model('IdentityVerification', identityVerificationSchema);
