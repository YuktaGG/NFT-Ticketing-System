const { ethers } = require('ethers');

class BlockchainConfig {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL
      );

      const network = await this.provider.getNetwork();
      console.log(`🔗 Connected to blockchain network: ${network.name} (Chain ID: ${network.chainId})`);

      if (!process.env.BACKEND_WALLET_PRIVATE_KEY) {
        throw new Error('BACKEND_WALLET_PRIVATE_KEY not set in environment');
      }

      this.wallet = new ethers.Wallet(
        process.env.BACKEND_WALLET_PRIVATE_KEY,
        this.provider
      );

      console.log(`👛 Backend wallet address: ${this.wallet.address}`);

      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);

      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error.message);
      throw error;
    }
  }

  getContract(contractAddress, contractABI) {
    if (!this.initialized) {
      throw new Error('Blockchain not initialized. Call initialize() first');
    }

    this.contract = new ethers.Contract(
      contractAddress || process.env.CONTRACT_ADDRESS,
      contractABI,
      this.wallet
    );

    return this.contract;
  }

  getReadOnlyContract(contractAddress, contractABI) {
    const contract = new ethers.Contract(
      contractAddress || process.env.CONTRACT_ADDRESS,
      contractABI,
      this.provider
    );
    return contract;
  }

  async waitForTransaction(txHash, confirmations = 1) {
    try {
      console.log(`⏳ Waiting for transaction ${txHash}...`);
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      
      if (receipt.status === 1) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      } else {
        console.error('❌ Transaction failed');
      }
      
      return receipt;
    } catch (error) {
      console.error('Transaction wait failed:', error.message);
      throw error;
    }
  }
}

const blockchainConfig = new BlockchainConfig();

module.exports = blockchainConfig;