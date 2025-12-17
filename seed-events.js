require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');

const events = [
  {
    name: "Summer Music Festival",
    description: "Amazing outdoor concert with top artists",
    eventDate: new Date("2025-08-15T18:00:00Z"),
    venue: "Central Park Arena",
    location: {
      city: "New York",
      country: "USA"
    },
    ticketPrice: 75,
    maxResalePrice: 100,
    royaltyPercentage: 10,
    totalTickets: 500,
    availableTickets: 500,
    eventId: 1,
    category: "concert",
    imageUrl: "https://picsum.photos/400/200",
    status: "published"
  },
  {
    name: "Tech Conference 2025",
    description: "Latest innovations in technology",
    eventDate: new Date("2025-09-20T09:00:00Z"),
    venue: "Convention Center",
    location: {
      city: "San Francisco",
      country: "USA"
    },
    ticketPrice: 150,
    maxResalePrice: 200,
    royaltyPercentage: 15,
    totalTickets: 1000,
    availableTickets: 1000,
    eventId: 2,
    category: "conference",
    imageUrl: "https://picsum.photos/400/201",
    status: "published"
  },
  {
    name: "Rock Concert",
    description: "Epic rock bands live performance",
    eventDate: new Date("2025-07-10T20:00:00Z"),
    venue: "Madison Square Garden",
    location: {
      city: "New York",
      country: "USA"
    },
    ticketPrice: 120,
    maxResalePrice: 180,
    royaltyPercentage: 12,
    totalTickets: 800,
    availableTickets: 800,
    eventId: 3,
    category: "concert",
    imageUrl: "https://picsum.photos/400/202",
    status: "published"
  }
];

async function seedEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Event.deleteMany({});
    console.log('🗑️  Cleared existing events');

    await Event.insertMany(events);
    console.log('✅ Created', events.length, 'events');

    mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedEvents();