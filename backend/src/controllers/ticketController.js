const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const blockchainService = require('../services/blockchainService');
const ipfsConfig = require('../config/ipfs');
const { ethers } = require('ethers');

exports.buyTicket = async (req, res, next) => {
  try {
    const { eventId, buyerAddress, paymentDetails } = req.body;

    if (!eventId || !buyerAddress || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!ethers.isAddress(buyerAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.availableTickets <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Event is sold out'
      });
    }

    console.log('💳 Processing payment...');
    const paymentResult = await simulatePayment(paymentDetails, event.ticketPrice);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: paymentResult.error
      });
    }

    const ticketNumber = event.soldTickets + 1;
    const metadata = ipfsConfig.createTicketMetadata({
      eventName: event.name,
      ticketNumber: ticketNumber,
      eventDate: event.eventDate.toISOString(),
      venue: event.venue,
      ticketType: 'Standard',
      originalPrice: event.ticketPrice,
      maxResalePrice: event.maxResalePrice
    });

    const ipfsResult = await ipfsConfig.uploadJSON(
      metadata,
      `ticket-${event.eventId}-${ticketNumber}`
    );

    const mintResult = await blockchainService.mintTicket(
      buyerAddress,
      event.eventId,
      ethers.parseEther(event.ticketPrice.toString()),
      ethers.parseEther(event.maxResalePrice.toString()),
      event.royaltyPercentage,
      ipfsResult.uri
    );

    const ticket = await Ticket.create({
      eventId: event._id,
      eventName: event.name,
      tokenId: mintResult.tokenId,
      contractAddress: process.env.CONTRACT_ADDRESS,
      currentOwner: buyerAddress.toLowerCase(),
      originalOwner: buyerAddress.toLowerCase(),
      originalPrice: event.ticketPrice,
      currentPrice: event.ticketPrice,
      maxResalePrice: event.maxResalePrice,
      purchaseMethod: 'credit_card',
      purchaseTransactionHash: mintResult.transactionHash,
      metadataUri: ipfsResult.uri,
      ipfsHash: ipfsResult.ipfsHash,
      paymentDetails: {
        transactionId: paymentResult.transactionId,
        paymentGateway: 'simulated',
        paymentStatus: 'completed',
        amount: event.ticketPrice,
        currency: 'USD',
        last4: paymentDetails.cardNumber?.slice(-4)
      },
      ownershipHistory: [{
        owner: buyerAddress.toLowerCase(),
        timestamp: new Date(),
        transactionHash: mintResult.transactionHash,
        price: event.ticketPrice
      }]
    });

    await event.sellTicket();

    res.status(201).json({
      success: true,
      message: 'Ticket purchased successfully',
      data: {
        ticket: {
          id: ticket._id,
          tokenId: ticket.tokenId,
          qrCode: ticket.qrCode,
          metadataUri: ticket.metadataUri,
          gatewayUrl: ipfsResult.gatewayUrl
        },
        transaction: {
          hash: mintResult.transactionHash,
          blockNumber: mintResult.blockNumber
        },
        payment: {
          transactionId: paymentResult.transactionId,
          amount: event.ticketPrice
        }
      }
    });

  } catch (error) {
    console.error('Buy ticket error:', error);
    next(error);
  }
};
exports.verifyTicket = async (req, res, next) => {
  try {
    const { qrCode, validatorAddress } = req.body;

    if (!qrCode || !validatorAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const ticket = await Ticket.findOne({ qrCode }).populate('eventId');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket QR code'
      });
    }

    if (ticket.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used',
        usedAt: ticket.usedAt
      });
    }

    const isValid = await blockchainService.verifyOwnership(
      ticket.tokenId,
      ticket.currentOwner
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ownership verification failed'
      });
    }

    const validateResult = await blockchainService.validateTicket(ticket.tokenId);

    await ticket.validateTicket(validatorAddress);

    res.status(200).json({
      success: true,
      message: 'Ticket validated successfully - Entry granted',
      data: {
        tokenId: ticket.tokenId,
        eventName: ticket.eventName,
        owner: ticket.currentOwner,
        validatedAt: ticket.usedAt,
        transactionHash: validateResult.transactionHash
      }
    });

  } catch (error) {
    console.error('Verify ticket error:', error);
    next(error);
  }
};

exports.getTicketsByOwner = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const tickets = await Ticket.find({ 
      currentOwner: address.toLowerCase() 
    }).populate('eventId');

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });

  } catch (error) {
    console.error('Get tickets by owner error:', error);
    next(error);
  }
};

exports.getTicketDetails = async (req, res, next) => {
  try {
    const { tokenId } = req.params;

    const ticket = await Ticket.findOne({ tokenId }).populate('eventId');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const blockchainTicket = await blockchainService.getTicketDetails(tokenId);

    res.status(200).json({
      success: true,
      data: {
        database: ticket,
        blockchain: blockchainTicket
      }
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    next(error);
  }
};

async function simulatePayment(paymentDetails, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1;
      
      if (success) {
        resolve({
          success: true,
          transactionId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          amount: amount,
          timestamp: new Date()
        });
      } else {
        resolve({
          success: false,
          error: 'Payment declined'
        });
      }
    }, 1000);
  });
}

module.exports = exports;