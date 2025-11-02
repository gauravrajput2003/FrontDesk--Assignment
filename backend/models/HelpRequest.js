const mongoose = require('mongoose');

const HelpRequestSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  callerPhone: {
    type: String,
    required: [true, 'Caller phone is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'timeout'],
    default: 'pending'
  },
  answer: {
    type: String,
    default: null,
    trim: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  timeoutAt: {
    type: Date,
    default: function() {
      // Set timeout to 30 minutes from now
      return new Date(Date.now() + 30 * 60 * 1000);
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'helprequests' // Explicit collection name
});

// Index for efficient queries
HelpRequestSchema.index({ status: 1, createdAt: -1 });
HelpRequestSchema.index({ timeoutAt: 1 });

// Virtual for checking if request is expired
HelpRequestSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && new Date() > this.timeoutAt;
});

// Method to check and update timeout status
HelpRequestSchema.methods.checkTimeout = async function() {
  if (this.status === 'pending' && new Date() > this.timeoutAt) {
    this.status = 'timeout';
    await this.save();
    return true;
  }
  return false;
};

// Static method to timeout all pending expired requests
HelpRequestSchema.statics.timeoutExpiredRequests = async function() {
  const now = new Date();
  const result = await this.updateMany(
    { 
      status: 'pending',
      timeoutAt: { $lt: now }
    },
    { 
      $set: { status: 'timeout' }
    }
  );
  return result.modifiedCount;
};

const HelpRequest = mongoose.model('HelpRequest', HelpRequestSchema);

module.exports = HelpRequest;