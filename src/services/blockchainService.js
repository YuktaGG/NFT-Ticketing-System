const { ethers } = require('ethers');
const blockchainConfig = require('../config/blockchain');

const CONTRACT_ABI = [
  "function mintTicket(address to, uint256 eventId, uint256 originalPrice, uint256 maxResalePrice, uint256 royaltyPercentage, string memory tokenURI) public returns (uint256)",
  "function listForSale(uint256 tokenId, uint256 price) public",
  "function unlistFromSale(uint256 tokenId) public",
  "function buyListedTicket(uint256 tokenId) public payable",
  "function useTicket(uint256 tokenId) public",
  "function getTicket(uint256 tokenId) public view returns (tuple(uint256 eventId, uint256 originalPrice, uint256 maxResalePrice, uint256 royaltyPercentage, address originalOwner, bool isUsed))",
  "function getListing(uint256 tokenId) public view returns (tuple(uint256 price, address seller, bool isActive))",
  "function isTicketValid(uint256 tokenId) public view returns (bool)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function getTicketsByOwner(address owner) public view returns (uint256[])",
  "event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner, string tokenURI)",
  "event TicketListed(uint256 indexed tokenId, uint256 price, address indexed seller)",
  "event TicketSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price)"
];

class BlockchainService {
  constructor() {
    this.contract = null;
  }

  async initialize() {
    if (!blockchainConfig.initialized) {
      await blockchainConfig.initialize();
    }
    
    this.contract = blockchainConfig.getContract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI
    );

    console.log('✅ Blockchain service initialized');
  }

  async mintTicket(buyerAddress, eventId, originalPrice, maxResalePrice, royaltyPercentage, tokenURI) {
    try {
      console.log('🎫 Minting ticket NFT...');
      
      if (!ethers.isAddress(buyerAddress)) {
        throw new Error('Invalid buyer address');
      }

      const originalPriceWei = typeof originalPrice === 'string' 
        ? ethers.parseEther(originalPrice) 
        : originalPrice;
      const maxResalePriceWei = typeof maxResalePrice === 'string'
        ? ethers.parseEther(maxResalePrice)
        : maxResalePrice;

      const tx = await this.contract.mintTicket(
        buyerAddress,
        eventId,
        originalPriceWei,
        maxResalePriceWei,
        royaltyPercentage,
        tokenURI,
        {
          gasLimit: 500000
        }
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Ticket minted in block ${receipt.blockNumber}`);

      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed && parsed.name === 'TicketMinted';
        } catch {
          return false;
        }
      });

      let tokenId;
      if (event) {
        const parsedEvent = this.contract.interface.parseLog(event);
        tokenId = parsedEvent.args.tokenId.toString();
      }

      return {
        success: true,
        tokenId: tokenId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Mint ticket failed:', error);
      throw new Error(`Failed to mint ticket: ${error.message}`);
    }
  }

  async listTicketForSale(tokenId, price, sellerPrivateKey) {
    try {
      console.log(`📝 Listing ticket ${tokenId} for sale...`);

      const sellerWallet = new ethers.Wallet(sellerPrivateKey, blockchainConfig.provider);
      const contractWithSeller = this.contract.connect(sellerWallet);

      const priceWei = typeof price === 'string' ? ethers.parseEther(price) : price;

      const tx = await contractWithSeller.listForSale(tokenId, priceWei, {
        gasLimit: 200000
      });

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Ticket listed in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('❌ List ticket failed:', error);
      throw new Error(`Failed to list ticket: ${error.message}`);
    }
  }

  async buyListedTicket(tokenId, buyerPrivateKey) {
    try {
      console.log(`🛒 Buying ticket ${tokenId}...`);

      const listing = await this.contract.getListing(tokenId);
      
      if (!listing.isActive) {
        throw new Error('Ticket is not listed for sale');
      }

      const buyerWallet = new ethers.Wallet(buyerPrivateKey, blockchainConfig.provider);
      const contractWithBuyer = this.contract.connect(buyerWallet);

      const tx = await contractWithBuyer.buyListedTicket(tokenId, {
        value: listing.price,
        gasLimit: 300000
      });

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Ticket purchased in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        price: ethers.formatEther(listing.price)
      };

    } catch (error) {
      console.error('❌ Buy ticket failed:', error);
      throw new Error(`Failed to buy ticket: ${error.message}`);
    }
  }

  async validateTicket(tokenId) {
    try {
      console.log(`✓ Validating ticket ${tokenId}...`);

      const isValid = await this.contract.isTicketValid(tokenId);
      
      if (!isValid) {
        throw new Error('Ticket is not valid (may already be used)');
      }

      const tx = await this.contract.useTicket(tokenId, {
        gasLimit: 150000
      });

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Ticket validated in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('❌ Validate ticket failed:', error);
      throw new Error(`Failed to validate ticket: ${error.message}`);
    }
  }

  async getTicketDetails(tokenId) {
    try {
      const ticket = await this.contract.getTicket(tokenId);
      const owner = await this.contract.ownerOf(tokenId);
      const listing = await this.contract.getListing(tokenId);

      return {
        eventId: ticket.eventId.toString(),
        originalPrice: ethers.formatEther(ticket.originalPrice),
        maxResalePrice: ethers.formatEther(ticket.maxResalePrice),
        royaltyPercentage: ticket.royaltyPercentage.toString(),
        originalOwner: ticket.originalOwner,
        isUsed: ticket.isUsed,
        currentOwner: owner,
        listing: {
          isActive: listing.isActive,
          price: listing.isActive ? ethers.formatEther(listing.price) : '0',
          seller: listing.seller
        }
      };

    } catch (error) {
      console.error('❌ Get ticket details failed:', error);
      throw new Error(`Failed to get ticket details: ${error.message}`);
    }
  }

  async getTicketsByOwner(ownerAddress) {
    try {
      if (!ethers.isAddress(ownerAddress)) {
        throw new Error('Invalid owner address');
      }

      const tokenIds = await this.contract.getTicketsByOwner(ownerAddress);
      
      return tokenIds.map(id => id.toString());

    } catch (error) {
      console.error('❌ Get tickets by owner failed:', error);
      throw new Error(`Failed to get tickets by owner: ${error.message}`);
    }
  }

  async verifyOwnership(tokenId, address) {
    try {
      const owner = await this.contract.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();

    } catch (error) {
      console.error('❌ Verify ownership failed:', error);
      return false;
    }
  }
}

const blockchainService = new BlockchainService();

module.exports = blockchainService;