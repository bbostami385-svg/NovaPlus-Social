import mongoose from 'mongoose';

const skillRatingSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
      unique: true,
    },

    // Batting Skills
    batting: {
      technique: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      shotSelection: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      consistency: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      aggression: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      temperament: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      overallBattingRating: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Bowling Skills
    bowling: {
      pace: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      accuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      variation: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lineAndLength: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      deception: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      overallBowlingRating: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Fielding Skills
    fielding: {
      catching: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      throwing: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      positioning: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      mobility: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      anticipation: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      overallFieldingRating: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Fitness Skills
    fitness: {
      speed: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      agility: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      strength: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      endurance: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      flexibility: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      overallFitnessRating: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Mental Skills
    mental: {
      concentration: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      decisionMaking: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      resilience: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      leadership: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      teamwork: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      overallMentalRating: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Overall Rating
    overallRating: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Rating History
    ratingHistory: [
      {
        date: Date,
        battingRating: Number,
        bowlingRating: Number,
        fieldingRating: Number,
        fitnessRating: Number,
        mentalRating: Number,
        overallRating: Number,
        ratedBy: String, // 'coach', 'ai', 'peer', 'system'
        notes: String,
      },
    ],

    // Rater Information
    ratedBy: {
      type: String,
      enum: ['coach', 'ai', 'peer', 'system'],
      default: 'system',
    },
    raterDetails: {
      raterId: mongoose.Schema.Types.ObjectId,
      raterName: String,
      raterRole: String,
    },

    // Improvement Areas
    improvementAreas: [
      {
        area: String,
        currentRating: Number,
        targetRating: Number,
        priority: String, // 'high', 'medium', 'low'
        suggestions: [String],
      },
    ],

    // Strengths
    strengths: [
      {
        skill: String,
        rating: Number,
        description: String,
      },
    ],

    // Comparison
    comparison: {
      nationalAverage: Number,
      stateAverage: Number,
      ageGroupAverage: Number,
      roleAverage: Number,
      percentile: Number,
    },

    // Metadata
    lastRatedDate: Date,
    nextRatingDueDate: Date,
    ratingFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
      default: 'quarterly',
    },
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
skillRatingSchema.index({ athleteId: 1 });
skillRatingSchema.index({ overallRating: -1 });

// Methods
skillRatingSchema.methods.calculateOverallRating = function () {
  const ratings = [
    this.batting.overallBattingRating,
    this.bowling.overallBowlingRating,
    this.fielding.overallFieldingRating,
    this.fitness.overallFitnessRating,
    this.mental.overallMentalRating,
  ];

  const validRatings = ratings.filter((r) => r > 0);
  if (validRatings.length === 0) return 0;

  this.overallRating = Math.round(validRatings.reduce((a, b) => a + b, 0) / validRatings.length);
  return this.overallRating;
};

skillRatingSchema.methods.calculateCategoryRating = function (category) {
  const skills = this[category];
  if (!skills) return 0;

  const ratings = Object.keys(skills)
    .filter((key) => key !== 'lastUpdated' && key !== `overall${category.charAt(0).toUpperCase() + category.slice(1)}Rating`)
    .map((key) => skills[key]);

  const validRatings = ratings.filter((r) => typeof r === 'number' && r > 0);
  if (validRatings.length === 0) return 0;

  const categoryRating = Math.round(validRatings.reduce((a, b) => a + b, 0) / validRatings.length);
  skills[`overall${category.charAt(0).toUpperCase() + category.slice(1)}Rating`] = categoryRating;
  skills.lastUpdated = new Date();

  return categoryRating;
};

skillRatingSchema.methods.updateSkillRating = function (category, skillName, rating) {
  if (this[category] && this[category][skillName] !== undefined) {
    this[category][skillName] = Math.min(100, Math.max(0, rating));
    this.calculateCategoryRating(category);
    this.calculateOverallRating();
    return this.save();
  }
  return Promise.reject(new Error('Invalid category or skill'));
};

skillRatingSchema.methods.addRatingRecord = function (ratingData) {
  this.ratingHistory.push({
    ...ratingData,
    date: new Date(),
  });

  if (this.ratingHistory.length > 24) {
    this.ratingHistory.shift();
  }

  this.lastRatedDate = new Date();
  return this.save();
};

skillRatingSchema.methods.identifyImprovementAreas = function (threshold = 60) {
  const areas = [];

  const categories = ['batting', 'bowling', 'fielding', 'fitness', 'mental'];
  categories.forEach((category) => {
    const skills = this[category];
    Object.keys(skills).forEach((skill) => {
      if (skill !== 'lastUpdated' && !skill.includes('overall') && typeof skills[skill] === 'number') {
        if (skills[skill] < threshold && skills[skill] > 0) {
          areas.push({
            area: `${category}.${skill}`,
            currentRating: skills[skill],
            targetRating: threshold,
            priority: skills[skill] < 40 ? 'high' : 'medium',
            suggestions: this.getSuggestions(category, skill),
          });
        }
      }
    });
  });

  this.improvementAreas = areas;
  return this.save();
};

skillRatingSchema.methods.getSuggestions = function (category, skill) {
  const suggestions = {
    batting: {
      technique: ['Work on footwork', 'Practice batting drills', 'Study technique videos'],
      shotSelection: ['Play more matches', 'Study bowler patterns', 'Practice specific shots'],
      consistency: ['Focus on mental training', 'Practice regularly', 'Analyze performance data'],
    },
    bowling: {
      pace: ['Strength training', 'Bowling practice', 'Work with bowling coach'],
      accuracy: ['Target practice', 'Bowling drills', 'Video analysis'],
      variation: ['Learn new deliveries', 'Practice variations', 'Study bowling patterns'],
    },
    fielding: {
      catching: ['Catching drills', 'Hand-eye coordination training', 'Practice regularly'],
      throwing: ['Throwing exercises', 'Accuracy drills', 'Strength training'],
      positioning: ['Study field placements', 'Watch match analysis', 'Practice positioning'],
    },
    fitness: {
      speed: ['Sprint training', 'Cardio workouts', 'Agility drills'],
      strength: ['Strength training', 'Weight lifting', 'Resistance exercises'],
      endurance: ['Long-distance running', 'Interval training', 'Conditioning'],
    },
  };

  return suggestions[category]?.[skill] || ['Continue training', 'Work with coach'];
};

export default mongoose.model('SkillRating', skillRatingSchema);
