const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

exports.createEvent = async (req, res, next) => {
  try {
    const {
      name,
      description,
      eventDate,
      venue,
      location,
      ticketPrice,
      maxResalePrice,
      royaltyPercentage,
      totalTickets,imageUrl,
      organizer,
      category,
      tags
    } = req.body;

    const eventCount = await Event.countDocuments();
    const eventId = eventCount + 1;

    const event = await Event.create({
      name,
      description,
      eventDate,
      venue,
      location,
      ticketPrice,
      maxResalePrice: maxResalePrice || ticketPrice * 1.5,
      royaltyPercentage: royaltyPercentage || 10,
      totalTickets,
      availableTickets: totalTickets,
      imageUrl,
      organizer,
      category,
      tags,
      eventId,
      status: 'published'
    });

    res.status(201).json({
      success: true,message: 'Event created successfully',
      data: event
    });

  } catch (error) {
    console.error('Create event error:', error);
    next(error);
  }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const {
      status,
      category,city,
      upcoming,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (upcoming === 'true') query.eventDate = { $gt: new Date() };
    
    if (search) {query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { venue: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(query)
      .sort({ eventDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: events
    });

  } catch (error) {
    console.error('Get all events error:', error);
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    }); } catch (error) {
    console.error('Get event by ID error:', error);
    next(error);
  }
};

exports.getEventTickets = async (req, res, next) => {
  try {
    const { status, listed } = req.query;
    
    let query = { eventId: req.params.id };
    
    if (status) query.status = status;
    if (listed === 'true') query.isListedForSale = true;
const tickets = await Ticket.find(query);

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });

  } catch (error) {
    console.error('Get event tickets error:', error);
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });

  } catch (error) {
    console.error('Update event error:', error);
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.soldTickets > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with sold tickets. Cancel the event instead.'});
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    next(error);
  }
};

module.exports = exports;