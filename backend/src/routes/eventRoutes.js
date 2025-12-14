const express = require('express');
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  getEventTickets,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

router.post('/', createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/:id/tickets', getEventTickets);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
