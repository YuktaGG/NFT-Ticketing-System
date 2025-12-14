const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  ticketPrice: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Price cannot be negative']
  },
  maxResalePrice: {
    type: Number,
    required: [true, 'Max resale price is required']
  },
  royaltyPercentage: {
    type: Number,
    default: 10,
    min: [0, 'Royalty cannot be negative'],
    max: [50, 'Royalty cannot exceed 50%']
  },

  totalTickets: {
    type: Number,
    required: [true, 'Total tickets is required'],
    min: [1, 'Must have at least 1 ticket']
  },
  availableTickets: {
    type: Number,
    required: true,
    min: [0, 'Available tickets cannot be negative']
  },
  soldTickets: {
    type: Number,
    default: 0,
    min: 0
  },

  eventId: {
    type: Number,
    required: true,
    unique: true
  },
  
  imageUrl: {
    type: String,
    default: ''
  },

  organizer: {
    name: String,
    email: String,
    walletAddress: String
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'sold_out', 'cancelled', 'completed'],
    default: 'draft'
  },
  
  category: {
    type: String,
    enum: ['concert', 'sports', 'conference', 'theater', 'festival', 'other'],
    default: 'other'
  },
  tags: [String],

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

eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ category: 1 });

eventSchema.methods.sellTicket = async function() {
  if (this.availableTickets <= 0) {
    throw new Error('No tickets available');
  }
  this.availableTickets -= 1;
  this.soldTickets += 1;
  return this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;