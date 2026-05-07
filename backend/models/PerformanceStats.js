import mongoose from 'mongoose';

const performanceStatsSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
      unique: true,
    },
    // Batting Stats
    batting: {
      totalMatches: {
        type: Number,
        default: 0,
      },
      totalInnings: {
        type: Number,
        default: 0,
      },
      totalRuns: {
        type: Number,
        default: 0,
      },
      highestScore: {
        type: Number,
        default: 0,
      },
      average: {
        type: Number,
        default: 0,
      },
      strikeRate: {
        type: Number,
        default: 0,
      },
      centuries: {
        type: Number,
        default: 0,
      },
      halfCenturies: {
        type: Number,
        default: 0,
      },
      notOuts: {
        type: Number,
        default: 0,
      },
      ducks: {
        type: Number,
        default: 0,
      },
      fours: {
        type: Number,
        default: 0,
      },
      sixes: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Bowling Stats
    bowling: {
      totalMatches: {
        type: Number,
        default: 0,
      },
      totalInnings: {
        type: Number,
        default: 0,
      },
      totalWickets: {
        type: Number,
        default: 0,
      },
      totalRuns: {
        type: Number,
        default: 0,
      },
      totalBalls: {
        type: Number,
        default: 0,
      },
      average: {
        type: Number,
        default: 0,
      },
      strikeRate: {
        type: Number,
        default: 0,
      },
      economyRate: {
        type: Number,
        default: 0,
      },
      bestFigures: String, // e.g., "5/20"
      fiveWicketHauls: {
        type: Number,
        default: 0,
      },
      tenWicketMatches: {
        type: Number,
        default: 0,
      },
      maidens: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Fielding Stats
    fielding: {
      totalMatches: {
        type: Number,
        default: 0,
      },
      catches: {
        type: Number,
        default: 0,
      },
      runouts: {
        type: Number,
        default: 0,
      },
      stumpings: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Fitness Stats
    fitness: {
      speed: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      agility: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      strength: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      endurance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      flexibility: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      overallFitness: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      lastUpdated: Date,
    },

    // Match History
    recentMatches: [
      {
        matchId: mongoose.Schema.Types.ObjectId,
        matchName: String,
        date: Date,
        opponent: String,
        venue: String,
        result: String, // 'won', 'lost', 'draw'
        battingStats: {
          runs: Number,
          balls: Number,
          fours: Number,
          sixes: Number,
        },
        bowlingStats: {
          wickets: Number,
          runs: Number,
          balls: Number,
        },
        fieldingStats: {
          catches: Number,
          runouts: Number,
        },
      },
    ],

    // Trends
    trends: {
      battingForm: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor'],
        default: 'average',
      },
      bowlingForm: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor'],
        default: 'average',
      },
      fitnessLevel: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor'],
        default: 'average',
      },
      lastUpdated: Date,
    },

    // Rankings
    rankings: {
      battingRank: Number,
      bowlingRank: Number,
      allRounderRank: Number,
      fitnessRank: Number,
      overallRank: Number,
      lastUpdated: Date,
    },

    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index
performanceStatsSchema.index({ athleteId: 1 });

// Methods
performanceStatsSchema.methods.calculateBattingAverage = function () {
  if (this.batting.totalInnings - this.batting.notOuts === 0) return 0;
  return (this.batting.totalRuns / (this.batting.totalInnings - this.batting.notOuts)).toFixed(2);
};

performanceStatsSchema.methods.calculateBattingStrikeRate = function () {
  if (this.batting.totalBalls === 0) return 0;
  return ((this.batting.totalRuns / this.batting.totalBalls) * 100).toFixed(2);
};

performanceStatsSchema.methods.calculateBowlingAverage = function () {
  if (this.bowling.totalWickets === 0) return 0;
  return (this.bowling.totalRuns / this.bowling.totalWickets).toFixed(2);
};

performanceStatsSchema.methods.calculateBowlingStrikeRate = function () {
  if (this.bowling.totalWickets === 0) return 0;
  return (this.bowling.totalBalls / this.bowling.totalWickets).toFixed(2);
};

performanceStatsSchema.methods.calculateEconomyRate = function () {
  if (this.bowling.totalBalls === 0) return 0;
  const overs = this.bowling.totalBalls / 6;
  return (this.bowling.totalRuns / overs).toFixed(2);
};

performanceStatsSchema.methods.updateBattingStats = function (statsData) {
  Object.assign(this.batting, statsData);
  this.batting.lastUpdated = new Date();
  this.batting.average = this.calculateBattingAverage();
  this.batting.strikeRate = this.calculateBattingStrikeRate();
  return this.save();
};

performanceStatsSchema.methods.updateBowlingStats = function (statsData) {
  Object.assign(this.bowling, statsData);
  this.bowling.lastUpdated = new Date();
  this.bowling.average = this.calculateBowlingAverage();
  this.bowling.strikeRate = this.calculateBowlingStrikeRate();
  this.bowling.economyRate = this.calculateEconomyRate();
  return this.save();
};

performanceStatsSchema.methods.updateFitnessStats = function (statsData) {
  Object.assign(this.fitness, statsData);
  const fitnessScores = [
    this.fitness.speed,
    this.fitness.agility,
    this.fitness.strength,
    this.fitness.endurance,
    this.fitness.flexibility,
  ];
  this.fitness.overallFitness = Math.round(fitnessScores.reduce((a, b) => a + b, 0) / fitnessScores.length);
  this.fitness.lastUpdated = new Date();
  return this.save();
};

performanceStatsSchema.methods.addRecentMatch = function (matchData) {
  this.recentMatches.unshift(matchData);
  if (this.recentMatches.length > 20) {
    this.recentMatches.pop();
  }
  return this.save();
};

export default mongoose.model('PerformanceStats', performanceStatsSchema);
