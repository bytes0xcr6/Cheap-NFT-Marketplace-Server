# Marketplace API Test Commands

## Listings

### Get All Listings

```bash
curl http://localhost:3000/listings
```

### Create New Listing

```bash
curl -X POST http://localhost:3000/listings \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "1",
    "nftContract": "0xf42b64907cefef5972851b6475913c3981d7be32",
    "tokenId": "1",
    "erc20Token": "0x678429e8e98fd5eae872a163a30b7ef6693bb2d7",
    "minPrice": "1000000000000000000",
    "deadline": "1735390637",
    "seller": "0x7A493930aF7BA5bEbbEE4BEb3C25e1F5bb59bfa3",
    "signature": "0x37a5abc32c65a35caeb0a87b364d3c19693f30e0a4b44cd662f9475f885301f7547c7c316e2c7f3db831bb8381ce9faf3f2360bfeae4ed1d7747cb9e8d4394ff1c"
  }'
```

## Bids

### Get Bids for Listing

```bash
curl http://localhost:3000/listings/1/bids
```

### Create New Bid

```bash
curl -X POST http://localhost:3000/listings/1/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000000000000000000",
    "deadline": "1735393697",
    "buyer": "0x7A493930aF7BA5bEbbEE4BEb3C25e1F5bb59bfa3",
    "signature": "0xee550b126c4f6d67e086c98d38ba0abcca3402a5b7857caca73660c12a9182cd6053ff8b192a81f925671fabcae0375be563ae49c43f4a4c16cbc0faaa9436031b"
  }'
```

### Get Approved Bids

```bash
curl http://localhost:3000/listings/1/approved-bids
```

### Approve Bid

```bash
curl -X POST http://localhost:3000/listings/1/bids/0x7A493930aF7BA5bEbbEE4BEb3C25e1F5bb59bfa3/approve \
  -H "Content-Type: application/json" \
  -d '{
    "sellerSignature": "0xfe9accb7688a511c7db66ea435810198a09d6d4fad6062c3df574fc244b9abe2236849efa2563f2c641f07bdd85fe6731b91d66ed32d7045f5b58233372e5b7a1c"
  }'
```

### Execute Trade

```bash
curl -X POST http://localhost:3000/listings/1/execute
```

## Notes

- All addresses are on Arbitrum Sepolia testnet
- Price/amount values are in wei (1000000000000000000 = 1 ETH)
- Deadlines are Unix timestamps
- Signatures must be generated using the appropriate private key
- Make sure to have NFT and ERC20 approvals before executing trades
