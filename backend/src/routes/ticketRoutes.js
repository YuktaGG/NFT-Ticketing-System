const express = require('express');
const router = express.Router();
const {
  buyTicket,
  verifyTicket,
  getTicketsByOwner,
  getTicketDetails
} = require('../controllers/ticketController');

router.post('/buy', buyTicket);
router.post('/verify', verifyTicket);
router.get('/owner/:address', getTicketsByOwner);
router.get('/:tokenId', getTicketDetails);

module.exports = router;