import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function approveTokens() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://sepolia-rollup.arbitrum.io/rpc"
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Approve NFT
  const nftContract = new ethers.Contract(
    "0xf42b64907cefef5972851b6475913c3981d7be32",
    ["function approve(address,uint256)"],
    wallet
  );

  // Approve ERC20
  const erc20Contract = new ethers.Contract(
    "0x678429e8e98fd5eae872a163a30b7ef6693bb2d7",
    ["function approve(address,uint256)"],
    wallet
  );

  const MARKETPLACE_ADDRESS = "0x67F0F3b6a70aac231c7660e56Ea63D73fd57BE36";
  const amount = ethers.utils.parseEther("1");
  const tokenId = "1";

  console.log("Approving NFT...");
  const nftTx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
  await nftTx.wait();
  console.log("NFT approved!");

  console.log("Approving ERC20 tokens...");
  const erc20Tx = await erc20Contract.approve(MARKETPLACE_ADDRESS, amount);
  await erc20Tx.wait();
  console.log("ERC20 tokens approved!");
}

approveTokens().catch(console.error);
