# 🚀 Deploy QuestEscrow Contract to Horizon Testnet

## Prerequisites

1. **Horizon Testnet HZN tokens** - Get testnet tokens from Horizon faucet
2. **Private key** - Your wallet's private key for deployment
3. **Node.js** - Make sure you have Node.js installed

## Step 1: Install Dependencies

```bash
npm install
```

This will install Hardhat and other required dependencies.

## Step 2: Set Up Environment Variables

1. Copy the environment template:

```bash
cp env.template .env.local
```

2. Edit `.env.local` and add your private key:

```bash
# Add your private key (keep this secret!)
PRIVATE_KEY="0x1234567890abcdef..."

# Contract address will be updated after deployment
NEXT_PUBLIC_QUEST_ESCROW_ADDRESS="0x0000000000000000000000000000000000000000"
```

⚠️ **Security Warning**: Never commit your private key to version control!

## Step 3: Get Horizon Testnet Tokens

1. Visit the Horizon testnet faucet
2. Connect your wallet
3. Request testnet HZN tokens
4. Make sure you have enough for gas fees

## Step 4: Deploy the Contract

Run the deployment script:

```bash
npm run deploy:horizon
```

This will:

-   Compile the QuestEscrow contract
-   Deploy it to Horizon testnet
-   Show you the contract address
-   Save deployment info to `deployment.json`

## Step 5: Update Your App

After deployment, you'll see output like:

```
✅ QuestEscrow deployed successfully!
📋 Contract Address: 0x1234567890abcdef...
🌐 Network: { name: 'horizon', chainId: 2018 }
```

1. **Copy the contract address**
2. **Update your `.env.local`**:

```bash
NEXT_PUBLIC_QUEST_ESCROW_ADDRESS="0x1234567890abcdef..."
```

3. **Restart your development server**:

```bash
npm run dev
```

## Step 6: Test the Deployment

1. **Open your app** at `http://localhost:3000`
2. **Connect your wallet** to Horizon testnet
3. **Create a quest** - this will trigger a real transaction
4. **Check the transaction** on Horizon explorer

## Alternative Networks

You can also deploy to other networks:

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to local network (for testing)
npm run deploy:local
```

## Troubleshooting

### Common Issues:

1. **"Insufficient funds"**

    - Get more testnet tokens from the faucet
    - Check you have enough HZN for gas fees

2. **"Private key not found"**

    - Make sure `PRIVATE_KEY` is set in `.env.local`
    - Don't include `0x` prefix in the private key

3. **"Network not found"**

    - Check your internet connection
    - Verify Horizon RPC URL is correct

4. **"Contract deployment failed"**
    - Check gas limit settings
    - Verify contract code compiles correctly

### Getting Help:

-   Check the deployment logs for error messages
-   Verify your wallet has testnet tokens
-   Make sure your private key is correct

## Contract Functions

Once deployed, your contract will have these functions:

-   `createQuest(string questId)` - Deposit funds for new quest
-   `releaseQuestFunds(string questId, address claimer)` - Release funds to claimer
-   `withdraw()` - Withdraw available balance
-   `cancelQuest(string questId)` - Cancel quest and get refund

## Next Steps

After successful deployment:

1. ✅ **Contract deployed** to Horizon testnet
2. ✅ **Address updated** in environment variables
3. ✅ **App restarted** with new contract address
4. ✅ **Ready to test** quest creation and fund management

Your ZKQuest platform is now live on Horizon testnet! 🎉

## Security Notes

-   **Never share your private key**
-   **Use testnet only** for development
-   **Verify contract address** before using
-   **Test thoroughly** before mainnet deployment
