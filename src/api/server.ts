import express from "express";
import { ethers } from "ethers";
import { MarketplaceService } from "../services/MarketplaceService";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "../config/marketplace.abi";

const app = express();
app.use(express.json());

const provider = new ethers.providers.JsonRpcProvider(
  "https://sepolia-rollup.arbitrum.io/rpc"
);

// Add logging icons
const LOG_ICONS = {
  SUCCESS: "✅",
  ERROR: "❌",
  INFO: "ℹ️ ",
  SERVER: "🚀",
  LISTING: "📦",
  BID: "💰",
  APPROVE: "✨",
};

// Initialize marketplace service
const marketplaceService = new MarketplaceService(
  provider,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI
);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`\n[!] ${req.method} ${req.url}`);
  next();
});

// Get all listings
app.get("/listings", (req, res) => {
  console.log(`${LOG_ICONS.INFO} Fetching all listings`);
  const listings = marketplaceService.getListings();
  console.log(`${LOG_ICONS.SUCCESS} Retrieved ${listings.length} listings`);
  res.json(listings);
});

// Get bids for a listing
app.get("/listings/:listingId/bids", (req, res) => {
  const { listingId } = req.params;
  console.log(`${LOG_ICONS.INFO} Fetching bids for listing ${listingId}`);
  const bids = marketplaceService.getBids(listingId);
  console.log(
    `${LOG_ICONS.SUCCESS} Retrieved ${bids.length} bids for listing ${listingId}`
  );
  res.json(bids);
});

// Get approved bids for a listing
app.get("/listings/:listingId/approved-bids", (req, res) => {
  const { listingId } = req.params;
  console.log(
    `${LOG_ICONS.INFO} Fetching approved bids for listing ${listingId}`
  );
  const approvedBids = marketplaceService.getApprovedBids(listingId);
  console.log(
    `${LOG_ICONS.SUCCESS} Retrieved ${approvedBids.length} approved bids for listing ${listingId}`
  );
  res.json(approvedBids);
});

// Create a new listing
app.post("/listings", async (req, res) => {
  try {
    console.log(`${LOG_ICONS.LISTING} Creating new listing:`, req.body);

    // Validate that seller signature is provided
    if (!req.body.signature) {
      throw new Error("Seller signature is required");
    }

    // Verify the signature matches the listing parameters
    const listingHash = await marketplaceService.createListingHash({
      listingId: req.body.listingId,
      nftContract: req.body.nftContract,
      tokenId: req.body.tokenId,
      erc20Token: req.body.erc20Token,
      minPrice: req.body.minPrice,
      deadline: req.body.deadline,
      seller: req.body.seller,
    });

    // Recover signer address from signature
    const recoveredAddress = ethers.utils.verifyMessage(
      ethers.utils.arrayify(listingHash),
      req.body.signature
    );

    // Verify that the signature is from the seller
    if (recoveredAddress.toLowerCase() !== req.body.seller.toLowerCase()) {
      throw new Error("Invalid seller signature");
    }

    const listing = await marketplaceService.createListing(req.body);
    console.log(`${LOG_ICONS.SUCCESS} Created listing:`, listing);
    res.json(listing);
  } catch (error) {
    console.error(`${LOG_ICONS.ERROR} Failed to create listing:`, error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create a new bid
app.post("/listings/:listingId/bids", async (req, res) => {
  const { listingId } = req.params;
  try {
    console.log(
      `${LOG_ICONS.BID} Creating new bid for listing ${listingId}:`,
      req.body
    );

    // Validate that buyer signature is provided
    if (!req.body.signature) {
      throw new Error("Buyer signature is required");
    }

    // Convert amount to BigNumber
    const amount = ethers.BigNumber.from(req.body.amount);

    // Verify the signature matches the bid parameters
    const bidHash = await marketplaceService.createBidHash({
      listingId,
      amount,
      deadline: req.body.deadline,
      buyer: req.body.buyer,
    });

    // Recover signer address from signature
    const recoveredAddress = ethers.utils.verifyMessage(
      ethers.utils.arrayify(bidHash),
      req.body.signature
    );

    // Verify that the signature is from the buyer
    if (recoveredAddress.toLowerCase() !== req.body.buyer.toLowerCase()) {
      throw new Error("Invalid buyer signature");
    }

    const bid = await marketplaceService.createBid({
      listingId,
      amount,
      deadline: req.body.deadline,
      buyer: req.body.buyer,
      signature: req.body.signature,
    });
    console.log(`${LOG_ICONS.SUCCESS} Created bid:`, bid);
    res.json(bid);
  } catch (error) {
    console.error(`${LOG_ICONS.ERROR} Failed to create bid:`, error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Approve a bid
app.post(
  "/listings/:listingId/bids/:buyerAddress/approve",
  async (req, res) => {
    try {
      const { listingId, buyerAddress } = req.params;
      console.log(
        `${LOG_ICONS.APPROVE} Approving bid for listing ${listingId} from buyer ${buyerAddress}`
      );
      const { sellerSignature } = req.body;

      const approvedBid = await marketplaceService.approveBid(
        listingId,
        buyerAddress,
        sellerSignature
      );
      console.log(`${LOG_ICONS.SUCCESS} Approved bid:`, approvedBid);
      res.json(approvedBid);
    } catch (error) {
      console.error(`${LOG_ICONS.ERROR} Failed to approve bid:`, error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Execute trade
app.post("/listings/:listingId/execute", async (req, res) => {
  try {
    const { listingId } = req.params;
    console.log(
      `${LOG_ICONS.APPROVE} Executing trade for listing ${listingId}`
    );

    const listing = marketplaceService
      .getListings()
      .find((l) => l.listingId === listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const approvedBids = marketplaceService.getApprovedBids(listingId);
    if (approvedBids.length === 0) {
      throw new Error("No approved bids found");
    }

    // Get the most recent approved bid
    const approvedBid = approvedBids[approvedBids.length - 1];

    if (!approvedBid.sellerSignature || !approvedBid.signature) {
      throw new Error("Missing required signatures");
    }

    // Execute the trade
    const tx = await marketplaceService.executeTrade({
      listingId,
      nftContract: listing.nftContract,
      tokenId: listing.tokenId,
      erc20Token: listing.erc20Token,
      amount: approvedBid.amount,
      listingDeadline: listing.deadline,
      bidDeadline: approvedBid.deadline,
      sellerSignature: approvedBid.sellerSignature,
      buyerSignature: approvedBid.signature,
      buyer: approvedBid.buyer,
    });

    console.log(`${LOG_ICONS.SUCCESS} Trade executed:`, tx.hash);
    res.json({
      transactionHash: tx.hash,
      listing,
      bid: approvedBid,
    });
  } catch (error) {
    console.error(`${LOG_ICONS.ERROR} Failed to execute trade:`, error);
    res.status(400).json({ error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${LOG_ICONS.SERVER} Server running on port ${PORT}`);
});
