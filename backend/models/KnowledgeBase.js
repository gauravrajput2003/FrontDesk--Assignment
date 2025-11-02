const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date,
    default: null
  },
  // Optional: Track which help request this came from
  sourceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpRequest',
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'knowledgebases' // Explicit collection name
});

// Indexes for efficient search
KnowledgeBaseSchema.index({ question: 'text', answer: 'text' }); // Full-text search
KnowledgeBaseSchema.index({ usageCount: -1 }); // Most used answers
KnowledgeBaseSchema.index({ createdAt: -1 }); // Recent answers

// Method to increment usage
KnowledgeBaseSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  await this.save();
  return this;
};

// Static method to search knowledge base
KnowledgeBaseSchema.statics.searchByQuestion = async function(searchQuery) {
  // Try text search first
  let results = await this.find(
    { $text: { $search: searchQuery } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(5);

  // If no results, try regex (less efficient but more flexible)
  if (results.length === 0) {
    results = await this.find({
      $or: [
        { question: { $regex: searchQuery, $options: 'i' } },
        { answer: { $regex: searchQuery, $options: 'i' } }
      ]
    }).limit(5);
  }

  return results;
};

// Static method to get most popular answers
KnowledgeBaseSchema.statics.getMostUsed = async function(limit = 10) {
  return await this.find()
    .sort({ usageCount: -1 })
    .limit(limit);
};

const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

module.exports = KnowledgeBase;