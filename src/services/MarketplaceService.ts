import { ethers, BigNumber } from "ethers";
import {
  Listing,
  Bid,
  ApprovedBid,
  MarketplaceState,
} from "../types/marketplace";
import dotenv from "dotenv";
dotenv.config();

export class MarketplaceService {
  private state: MarketplaceState;
  private provider: ethers.providers.JsonRpcProvider;
  private marketplaceContract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor(
    provider: ethers.providers.JsonRpcProvider,
    marketplaceAddress: string,
    marketplaceAbi: any
  ) {
    this.state = {
      listings: new Map(),
      bids: new Map(),
      approvedBids: new Map(),
    };
    this.provider = provider;

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable is required");
    }
    this.wallet = new ethers.Wallet(privateKey, provider);

    this.marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      marketplaceAbi,
      this.wallet
    );
  }

  public async createListing(
    listing: Omit<Listing, "signature">
  ): Promise<Listing> {
    const listingHash = await this.marketplaceContract.createListingHash(
      listing.listingId,
      listing.nftContract,
      listing.tokenId,
      listing.erc20Token,
      listing.minPrice,
      listing.deadline
    );

    this.state.listings.set(listing.listingId, listing as Listing);
    return listing as Listing;
  }

  public async createBid(
    bid: Omit<Bid, "signature"> & { signature?: string }
  ): Promise<Bid> {
    const bidHash = await this.marketplaceContract.createBidHash(
      bid.listingId,
      bid.amount,
      bid.deadline
    );

    const listing = this.state.listings.get(bid.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const minPrice = ethers.BigNumber.from(listing.minPrice);
    const amount = ethers.BigNumber.from(bid.amount);

    if (amount.lt(minPrice)) {
      throw new Error("Bid amount below minimum price");
    }

    const bids = this.state.bids.get(bid.listingId) || [];
    bids.push(bid as Bid);
    this.state.bids.set(bid.listingId, bids);

    return bid as Bid;
  }

  public async approveBid(
    listingId: string,
    buyerAddress: string,
    sellerSignature: string
  ): Promise<ApprovedBid> {
    const bids = this.state.bids.get(listingId) || [];
    const bid = bids.find((b) => b.buyer === buyerAddress);

    if (!bid) {
      throw new Error("Bid not found");
    }

    const approvedBid: ApprovedBid = {
      ...bid,
      sellerSignature,
    };

    const approvedBids = this.state.approvedBids.get(listingId) || [];
    approvedBids.push(approvedBid);
    this.state.approvedBids.set(listingId, approvedBids);

    return approvedBid;
  }

  public getListings(): Listing[] {
    return Array.from(this.state.listings.values());
  }

  public getBids(listingId: string): Bid[] {
    return this.state.bids.get(listingId) || [];
  }

  public getApprovedBids(listingId: string): ApprovedBid[] {
    return this.state.approvedBids.get(listingId) || [];
  }

  public async createListingHash(
    listing: Omit<Listing, "signature">
  ): Promise<string> {
    return await this.marketplaceContract.createListingHash(
      listing.listingId,
      listing.nftContract,
      listing.tokenId,
      listing.erc20Token,
      listing.minPrice,
      listing.deadline
    );
  }

  public async createBidHash(bid: Omit<Bid, "signature">): Promise<string> {
    return await this.marketplaceContract.createBidHash(
      bid.listingId,
      bid.amount,
      bid.deadline
    );
  }

  public async executeTrade(params: {
    listingId: string;
    nftContract: string;
    tokenId: string | BigNumber;
    erc20Token: string;
    amount: string | BigNumber;
    listingDeadline: string | number;
    bidDeadline: string | number;
    sellerSignature: string;
    buyerSignature: string;
    buyer: string;
  }) {
    // Check NFT approval
    const nftContract = new ethers.Contract(
      params.nftContract,
      [
        "function getApproved(uint256) view returns (address)",
        "function ownerOf(uint256) view returns (address)",
      ],
      this.provider
    );

    // Check NFT ownership and approval
    const owner = await nftContract.ownerOf(params.tokenId);
    const approved = await nftContract.getApproved(params.tokenId);

    if (owner.toLowerCase() !== params.buyer.toLowerCase()) {
      throw new Error("NFT not owned by seller");
    }

    if (
      approved.toLowerCase() !== this.marketplaceContract.address.toLowerCase()
    ) {
      throw new Error("NFT not approved for marketplace");
    }

    // Check ERC20 approval
    const erc20Contract = new ethers.Contract(
      params.erc20Token,
      [
        "function allowance(address,address) view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
      ],
      this.provider
    );

    const allowance = await erc20Contract.allowance(
      params.buyer,
      this.marketplaceContract.address
    );
    const balance = await erc20Contract.balanceOf(params.buyer);
    const amount = ethers.BigNumber.from(params.amount);

    if (balance.lt(amount)) {
      throw new Error("Insufficient token balance");
    }

    if (allowance.lt(amount)) {
      throw new Error("Insufficient token allowance");
    }

    // Add gas limit explicitly
    const tx = await this.marketplaceContract.settleTrade(
      params.listingId,
      params.nftContract,
      params.tokenId,
      params.erc20Token,
      params.amount,
      params.listingDeadline,
      params.bidDeadline,
      params.sellerSignature,
      params.buyerSignature,
      params.buyer,
      {
        gasLimit: 500000, // Set a reasonable gas limit
      }
    );

    return tx;
  }
}
