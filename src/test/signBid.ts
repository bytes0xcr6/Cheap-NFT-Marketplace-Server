import { ethers } from "ethers";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "../config/marketplace.abi";
import dotenv from "dotenv";
dotenv.config();

async function testSignBid() {
  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(
    "https://sepolia-rollup.arbitrum.io/rpc"
  );

  // Replace with your private key - NEVER use this in production
  const PRIVATE_KEY = process.env.PRIVATE_KEY!;
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Initialize contract
  const marketplaceContract = new ethers.Contract(
    MARKETPLACE_ADDRESS,
    MARKETPLACE_ABI,
    wallet
  );

  // Example bid parameters
  const bid = {
    listingId: "1",
    amount: ethers.utils.parseEther("1"), // 1 ETH
    deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    buyer: wallet.address,
  };

  try {
    // Get bid hash from contract
    const bidHash = await marketplaceContract.createBidHash(
      bid.listingId,
      bid.amount,
      bid.deadline
    );

    console.log("Bid Hash:", bidHash);

    // Sign the bid hash
    const signature = await wallet.signMessage(ethers.utils.arrayify(bidHash));
    console.log("Signature:", signature);

    // Verify the signature
    const recoveredAddress = ethers.utils.verifyMessage(
      ethers.utils.arrayify(bidHash),
      signature
    );
    console.log("Recovered Address:", recoveredAddress);
    console.log("Original Address:", wallet.address);
    console.log(
      "Signature Valid:",
      recoveredAddress.toLowerCase() === wallet.address.toLowerCase()
    );

    // Create the curl command for testing
    console.log("\nCURL command to create bid:");
    console.log(`curl -X POST http://localhost:3000/listings/${
      bid.listingId
    }/bids \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "${bid.amount.toString()}",
    "deadline": "${bid.deadline}",
    "buyer": "${bid.buyer}",
    "signature": "${signature}"
  }'`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
testSignBid().catch(console.error);
