const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  eventName: {
    type: String,
    required: true
  },

  tokenId: {
    type: Number,
    required: true,
    unique: true
  },
  contractAddress: {
    type: String,
    required: true
  },
  
  currentOwner: {
    type: String,
    required: [true, 'Owner wallet address is required'],
    lowercase: true
  },
  originalOwner: {
    type: String,
    required: true,
    lowercase: true
  },
  ownershipHistory: [{
    owner: String,
    timestamp: Date,
    transactionHash: String,
    price: Number
  }],

  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  maxResalePrice: {
    type: Number,
    required: true
  },

  isListedForSale: {
    type: Boolean,
    default: false
  },
  listingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  listedAt: {
    type: Date
  },

  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  validatedBy: {
    type: String
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },

  metadataUri: {
    type: String,
    required: true
  },
  ipfsHash: {
    type: String
  },

  purchaseMethod: {
    type: String,
    enum: ['credit_card', 'crypto', 'resale'],
    default: 'credit_card'
  },
  purchaseTransactionHash: {
    type: String
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },

  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    },
    amount: Number,
    currency: String,
    last4: String
  },

  seat: {
    section: String,
    row: String,
    number: String
  },

  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled', 'transferred'],
    default: 'active'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ticketSchema.index({ tokenId: 1 });
ticketSchema.index({ currentOwner: 1, status: 1 });
ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ isListedForSale: 1 });
ticketSchema.index({ qrCode: 1 });

ticketSchema.methods.listForSale = async function(price) {
  if (this.isUsed) {
    throw new Error('Cannot list a used ticket');
  }
  if (price > this.maxResalePrice) {
    throw new Error(`Listing price cannot exceed ${this.maxResalePrice}`);
  }
  
  this.isListedForSale = true;
  this.listingPrice = price;
  this.listedAt = new Date();
  return this.save();
};

ticketSchema.methods.validateTicket = async function(validatorAddress) {
  if (this.isUsed) {
    throw new Error('Ticket already used');
  }
  if (this.status !== 'active') {
    throw new Error('Ticket is not active');
  }
  
  this.isUsed = true;
  this.usedAt = new Date();
  this.validatedBy = validatorAddress.toLowerCase();
  this.status = 'used';
  
  return this.save();
};

ticketSchema.pre('save', function(next) {
  if (!this.qrCode) {
    const crypto = require('crypto');
    this.qrCode = crypto.randomBytes(32).toString('hex');
  }
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;