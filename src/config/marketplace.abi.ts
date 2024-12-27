export const MARKETPLACE_ABI = [
  // Listing functions
  "function createListingHash(uint256 listingId, address nftContract, uint256 tokenId, address erc20Token, uint256 minPrice, uint256 deadline) public pure returns (bytes32)",

  // Bid functions
  "function createBidHash(uint256 listingId, uint256 amount, uint256 deadline) public pure returns (bytes32)",

  // Trade functions
  "function settleTrade(uint256 listingId, address nftContract, uint256 tokenId, address erc20Token, uint256 amount, uint256 listingDeadline, uint256 bidDeadline, bytes memory sellerSignature, bytes memory buyerSignature, address buyer) external",

  // Validation functions
  "function checkTradeValidity(address buyer, address seller, address nftContract, uint256 tokenId, address erc20Token, uint256 amount) external view returns (bool buyerValid, bool sellerValid)",
];

export const MARKETPLACE_ADDRESS = "0x67f0f3b6a70aac231c7660e56ea63d73fd57be36";
