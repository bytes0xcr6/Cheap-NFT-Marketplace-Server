import { ethers } from "ethers";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "../config/marketplace.abi";
import dotenv from "dotenv";
dotenv.config();

async function testSignListing() {
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

  // Example listing parameters
  const listing = {
    listingId: "1",
    nftContract: "0xf42b64907cefef5972851b6475913c3981d7be32",
    tokenId: ethers.BigNumber.from("1"),
    erc20Token: "0x678429e8e98fd5eae872a163a30b7ef6693bb2d7",
    minPrice: ethers.utils.parseEther("1"), // 1 ETH
    deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    seller: wallet.address,
  };

  try {
    // Get listing hash from contract
    const listingHash = await marketplaceContract.createListingHash(
      listing.listingId,
      listing.nftContract,
      listing.tokenId,
      listing.erc20Token,
      listing.minPrice,
      listing.deadline
    );

    console.log("Listing Hash:", listingHash);

    // Sign the listing hash
    const signature = await wallet.signMessage(
      ethers.utils.arrayify(listingHash)
    );
    console.log("Signature:", signature);

    // Verify the signature
    const recoveredAddress = ethers.utils.verifyMessage(
      ethers.utils.arrayify(listingHash),
      signature
    );
    console.log("Recovered Address:", recoveredAddress);
    console.log("Original Address:", wallet.address);
    console.log(
      "Signature Valid:",
      recoveredAddress.toLowerCase() === wallet.address.toLowerCase()
    );

    // Create the curl command for testing
    console.log("\nCURL command to create listing:");
    console.log(`curl -X POST http://localhost:3000/listings \\
  -H "Content-Type: application/json" \\
  -d '{
    "listingId": "${listing.listingId}",
    "nftContract": "${listing.nftContract}",
    "tokenId": "${listing.tokenId.toString()}",
    "erc20Token": "${listing.erc20Token}",
    "minPrice": "${listing.minPrice.toString()}",
    "deadline": "${listing.deadline}",
    "seller": "${listing.seller}",
    "signature": "${signature}"
  }'`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
testSignListing().catch(console.error);
