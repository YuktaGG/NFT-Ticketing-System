class IPFSConfig {
  constructor() {
    this.enabled = false;
  }

  createTicketMetadata(ticketData) {
    return {
      name: `${ticketData.eventName} - Ticket #${ticketData.ticketNumber}`,
      description: `Official NFT ticket for ${ticketData.eventName} on ${ticketData.eventDate}`,
      image: ticketData.imageUri || 'ipfs://QmDefaultTicketImage',
      attributes: [
        {
          trait_type: 'Event Name',
          value: ticketData.eventName
        },
        {
          trait_type: 'Event Date',
          value: ticketData.eventDate
        },
        {
          trait_type: 'Venue',
          value: ticketData.venue
        },
        {
          trait_type: 'Original Price',
          value: ticketData.originalPrice
        }
      ]
    };
  }

  async uploadJSON(metadata, name) {
    // For local testing, return mock IPFS response
    const mockHash = 'Qm' + Math.random().toString(36).substring(7);
    return {
      success: true,
      ipfsHash: mockHash,
      uri: `ipfs://${mockHash}`,
      gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`
    };
  }
}

const ipfsConfig = new IPFSConfig();

module.exports = ipfsConfig;