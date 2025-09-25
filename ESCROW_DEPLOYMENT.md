# Quest Escrow Smart Contract Deployment Guide

## Overview

The ZKQuest platform now includes a smart contract escrow system that holds funds when quests are created and releases them when claims are verified.

## Smart Contract

The `QuestEscrow.sol` contract is located in `src/contracts/QuestEscrow.sol` and provides:

-   **Quest Creation**: Deposits ETH into escrow when creating a quest
-   **Fund Release**: Releases funds to approved claimers
-   **Withdrawal System**: Users can withdraw their earned funds
-   **Quest Cancellation**: Creators can cancel and get refunds for incomplete quests

## Deployment Steps

### 1. Deploy the Contract

You can deploy the contract using:

-   **Remix IDE**: Copy the contract code to Remix and deploy
-   **Hardhat/Foundry**: Set up a deployment script
-   **Manual deployment**: Use any Ethereum deployment tool

### 2. Update Environment Variables

After deployment, update your `.env.local` file:

```bash
NEXT_PUBLIC_QUEST_ESCROW_ADDRESS=0xYourDeployedContractAddress
```

### 3. Configure Supported Networks

Update `src/contracts/config.ts` to include your target networks (Sepolia, Mainnet, etc.)

## How It Works

### Quest Creation Flow

1. **User fills out quest form** → Frontend validation
2. **Click "Create Quest"** → Triggers wallet transaction
3. **Wallet prompts for confirmation** → User approves ETH deposit
4. **Transaction confirmed** → Quest saved to database with transaction hash
5. **Quest goes live** → Funds held in escrow contract

### Claim Verification Flow

1. **User submits claim** → Stored as PENDING in database
2. **Quest creator approves claim** → Triggers `releaseQuestFunds()` contract call
3. **Funds released to claimer** → Claimer can withdraw via `withdraw()` function
4. **Quest marked as COMPLETED** → Database updated

## Contract Functions

### Core Functions

-   `createQuest(string questId)` - Deposit funds for new quest
-   `releaseQuestFunds(string questId, address claimer)` - Release funds to claimer
-   `withdraw()` - Withdraw available balance
-   `cancelQuest(string questId)` - Cancel quest and get refund

### View Functions

-   `getQuest(string questId)` - Get quest details
-   `getBalance(address user)` - Get user's withdrawable balance
-   `hasAvailableFunds(string questId)` - Check if funds are available

## Testing Locally

### Option 1: Local Blockchain (Recommended for testing)

1. Start a local blockchain:

```bash
npx hardhat node
```

2. Deploy contract to localhost:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Update config to use localhost network

### Option 2: Testnet (Sepolia)

1. Get Sepolia ETH from faucet
2. Deploy to Sepolia testnet
3. Update config with Sepolia contract address

## Security Considerations

-   ✅ **Reentrancy Protection**: Contract uses checks-effects-interactions pattern
-   ✅ **Access Control**: Only quest creators can release funds
-   ✅ **Fund Safety**: Funds are held securely until explicitly released
-   ✅ **Withdrawal Pattern**: Users pull their funds rather than automatic push

## Current Limitations

-   **Quest Creator Trust**: Currently only quest creators can release funds
-   **No Dispute Resolution**: No built-in arbitration system
-   **Single Token**: Only supports ETH (can be extended for ERC-20)

## Future Enhancements

-   **Multi-signature approval** for fund release
-   **Time-based automatic releases** for expired quests
-   **ERC-20 token support** for different reward tokens
-   **Dispute resolution system** with arbitrators
-   **ZK proof verification** integration

## Integration Status

✅ **Smart Contract**: Created and ready for deployment  
✅ **Frontend Integration**: Quest creation triggers wallet transactions  
✅ **Database Schema**: Updated to store transaction hashes  
✅ **API Endpoints**: Updated to handle blockchain data  
⏳ **Contract Deployment**: Needs to be deployed to your target network  
⏳ **Testing**: Needs testing on testnet/mainnet

## Next Steps

1. **Deploy the contract** to your target network
2. **Update the contract address** in the config
3. **Test the full flow** on testnet
4. **Deploy to mainnet** when ready

The system is now ready for real blockchain integration! 🚀
