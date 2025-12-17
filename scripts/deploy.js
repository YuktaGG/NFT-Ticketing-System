const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting contract deployment...");

  const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
  
  console.log("📝 Deploying TicketNFT contract...");
  
  const ticketNFT = await TicketNFT.deploy();
  
  await ticketNFT.waitForDeployment();
  
  const contractAddress = await ticketNFT.getAddress();
  
  console.log("✅ TicketNFT deployed to:", contractAddress);
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", (await hre.ethers.getSigners())[0].address);
  
  console.log("\n🔧 Update your .env file with:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  
  console.log("\n⏳ Waiting for block confirmations...");
  await ticketNFT.deploymentTransaction().wait(1);
  
  console.log("✅ Contract confirmed on blockchain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });