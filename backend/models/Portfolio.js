import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
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

    // Portfolio Info
    title: {
      type: String,
      default: 'My Portfolio',
    },
    description: String,
    coverImage: String,
    profileImage: String,

    // Portfolio Sections
    projects: [
      {
        projectId: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        category: String,
        tags: [String],
        startDate: Date,
        endDate: Date,
        isOngoing: Boolean,
        images: [String],
        videos: [String],
        links: [
          {
            label: String,
            url: String,
          },
        ],
        role: String,
        skills: [String],
        results: [String],
        testimonials: [
          {
            author: String,
            text: String,
            rating: Number,
          },
        ],
        views: {
          type: Number,
          default: 0,
        },
        likes: {
          type: Number,
          default: 0,
        },
        createdAt: Date,
      },
    ],

    // Work Samples
    workSamples: [
      {
        sampleId: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        category: String,
        type: {
          type: String,
          enum: ['code', 'design', 'content', 'media', 'document', 'other'],
        },
        file: String,
        thumbnail: String,
        tags: [String],
        views: {
          type: Number,
          default: 0,
        },
        downloads: {
          type: Number,
          default: 0,
        },
        createdAt: Date,
      },
    ],

    // Case Studies
    caseStudies: [
      {
        caseStudyId: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        clientName: String,
        industry: String,
        challenge: String,
        solution: String,
        results: [String],
        beforeImage: String,
        afterImage: String,
        metrics: [
          {
            metric: String,
            value: String,
          },
        ],
        testimonial: {
          author: String,
          position: String,
          text: String,
          rating: Number,
        },
        tags: [String],
        views: {
          type: Number,
          default: 0,
        },
        createdAt: Date,
      },
    ],

    // Certifications & Credentials
    certifications: [
      {
        certificationId: mongoose.Schema.Types.ObjectId,
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        credentialUrl: String,
        certificateImage: String,
        skills: [String],
        verificationStatus: {
          type: String,
          enum: ['unverified', 'verified'],
          default: 'unverified',
        },
      },
    ],

    // Education
    education: [
      {
        educationId: mongoose.Schema.Types.ObjectId,
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        isCurrentlyStudying: Boolean,
        description: String,
        grade: String,
        activities: [String],
        skills: [String],
      },
    ],

    // Experience
    experience: [
      {
        experienceId: mongoose.Schema.Types.ObjectId,
        title: String,
        company: String,
        employmentType: String,
        location: String,
        startDate: Date,
        endDate: Date,
        isCurrentlyWorking: Boolean,
        description: String,
        skills: [String],
        achievements: [String],
      },
    ],

    // Skills Showcase
    skills: [
      {
        skillId: mongoose.Schema.Types.ObjectId,
        name: String,
        category: String,
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        endorsements: {
          type: Number,
          default: 0,
        },
        yearsOfExperience: Number,
        projects: [mongoose.Schema.Types.ObjectId],
      },
    ],

    // Testimonials & Reviews
    testimonials: [
      {
        testimonialId: mongoose.Schema.Types.ObjectId,
        author: String,
        authorImage: String,
        authorRole: String,
        text: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        date: Date,
        verified: Boolean,
      },
    ],

    // Awards & Recognition
    awards: [
      {
        awardId: mongoose.Schema.Types.ObjectId,
        title: String,
        issuer: String,
        date: Date,
        description: String,
        image: String,
      },
    ],

    // Media Gallery
    gallery: [
      {
        mediaId: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        type: {
          type: String,
          enum: ['image', 'video', 'document'],
        },
        url: String,
        thumbnail: String,
        tags: [String],
        views: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Portfolio Settings
    settings: {
      isPublic: {
        type: Boolean,
        default: true,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowDownloads: {
        type: Boolean,
        default: false,
      },
      allowSharing: {
        type: Boolean,
        default: true,
      },
      showViewCount: {
        type: Boolean,
        default: true,
      },
      customDomain: String,
      theme: String,
      layout: {
        type: String,
        enum: ['grid', 'list', 'carousel', 'masonry'],
        default: 'grid',
      },
    },

    // Analytics
    analytics: {
      totalViews: {
        type: Number,
        default: 0,
      },
      totalLikes: {
        type: Number,
        default: 0,
      },
      totalShares: {
        type: Number,
        default: 0,
      },
      totalDownloads: {
        type: Number,
        default: 0,
      },
      uniqueVisitors: {
        type: Number,
        default: 0,
      },
      viewsByDay: [
        {
          date: Date,
          views: Number,
        },
      ],
      topProjects: [
        {
          projectId: mongoose.Schema.Types.ObjectId,
          views: Number,
        },
      ],
      referralSources: [
        {
          source: String,
          views: Number,
        },
      ],
      lastUpdated: Date,
    },

    // Social Links
    socialLinks: {
      website: String,
      github: String,
      linkedin: String,
      twitter: String,
      instagram: String,
      behance: String,
      dribbble: String,
      youtube: String,
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
  },
  { timestamps: true }
);

// Index
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ profileId: 1 });
portfolioSchema.index({ 'settings.isPublic': 1 });

// Methods
portfolioSchema.methods.addProject = function (projectData) {
  this.projects.push({
    ...projectData,
    projectId: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
  });
  return this.save();
};

portfolioSchema.methods.addWorkSample = function (sampleData) {
  this.workSamples.push({
    ...sampleData,
    sampleId: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
  });
  return this.save();
};

portfolioSchema.methods.addCaseStudy = function (caseStudyData) {
  this.caseStudies.push({
    ...caseStudyData,
    caseStudyId: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
  });
  return this.save();
};

portfolioSchema.methods.addCertification = function (certificationData) {
  this.certifications.push({
    ...certificationData,
    certificationId: new mongoose.Types.ObjectId(),
  });
  return this.save();
};

portfolioSchema.methods.addTestimonial = function (testimonialData) {
  this.testimonials.push({
    ...testimonialData,
    testimonialId: new mongoose.Types.ObjectId(),
    date: new Date(),
  });
  return this.save();
};

portfolioSchema.methods.recordView = function (projectId = null) {
  this.analytics.totalViews += 1;
  if (projectId) {
    const project = this.projects.find((p) => p.projectId.toString() === projectId.toString());
    if (project) {
      project.views += 1;
    }
  }
  return this.save();
};

portfolioSchema.methods.recordLike = function (projectId = null) {
  this.analytics.totalLikes += 1;
  if (projectId) {
    const project = this.projects.find((p) => p.projectId.toString() === projectId.toString());
    if (project) {
      project.likes += 1;
    }
  }
  return this.save();
};

portfolioSchema.methods.getPublicPortfolio = function () {
  if (!this.settings.isPublic) {
    return null;
  }
  return this;
};

export default mongoose.model('Portfolio', portfolioSchema);
