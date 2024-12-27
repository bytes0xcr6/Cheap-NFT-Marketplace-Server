import { BigNumber } from "ethers";

export interface Listing {
  listingId: string;
  nftContract: string;
  tokenId: string | BigNumber;
  erc20Token: string;
  minPrice: string | BigNumber;
  deadline: string | number;
  seller: string;
  signature?: string;
}

export interface Bid {
  listingId: string;
  amount: string | BigNumber;
  deadline: string | number;
  buyer: string;
  signature?: string;
}

export interface ApprovedBid extends Bid {
  sellerSignature: string;
}

export interface MarketplaceState {
  listings: Map<string, Listing>;
  bids: Map<string, Bid[]>;
  approvedBids: Map<string, ApprovedBid[]>;
}
