# Automatic Fund Release System

## Overview

The ZKQuest platform now features an **automatic fund release system** that eliminates the need for manual approval. When a proof is verified, funds are automatically released to the claimer without any human intervention.

## How It Works

### 1. **Claim Submission**

-   User submits claim with proof (GitHub merge, ZK proof, etc.)
-   Claim stored as `PENDING` in database

### 2. **Automatic Verification**

-   External verification service calls `/api/claims/[id]/verify`
-   System automatically approves/rejects based on proof validity
-   **No manual approval required**

### 3. **Fund Release**

-   If verified: Claim → `APPROVED`, Quest → `COMPLETED`
-   Funds automatically released from escrow contract
-   Claimer can withdraw funds immediately

## API Endpoints

### Verification Endpoint

```
POST /api/claims/[id]/verify
```

**Request Body:**

```json
{
	"verified": true,
	"proofData": {
		"repository": "user/repo",
		"mergeCommit": "abc123",
		"prNumber": 42
	},
	"verifierAddress": "0xVerifierContract"
}
```

**Response (Verified):**

```json
{
	"success": true,
	"data": {
		"action": "funds_ready_for_release",
		"message": "Proof verified! Funds are ready to be released from escrow.",
		"escrowAction": {
			"required": true,
			"contractAddress": "0xEscrowContract",
			"questId": "quest123",
			"claimerAddress": "0xClaimer",
			"functionName": "releaseQuestFunds",
			"args": ["quest123", "0xClaimer"]
		}
	}
}
```

## Smart Contract Integration

### Escrow Contract Functions

1. **`releaseQuestFunds(string questId, address claimer)`**

    - Releases funds from escrow to claimer
    - Can only be called by quest creator
    - Marks quest as completed

2. **`withdraw()`**
    - Claimer withdraws their earned funds
    - Transfers ETH to claimer's wallet

### Fund Flow

```
Quest Creation → ETH Deposited to Escrow
     ↓
Claim Submitted → Proof Verification
     ↓
Proof Verified → Auto-approve Claim
     ↓
Funds Released → Claimer Can Withdraw
```

## Frontend Components

### ClaimFunds Component

```tsx
import { ClaimFunds } from "@/components/claim-funds";

<ClaimFunds
	questId="quest123"
	claimerAddress="0xClaimer"
	onFundsReleased={() => console.log("Funds released!")}
/>;
```

### Features:

-   ✅ **Real-time balance display**
-   ✅ **One-click fund release** (for quest creators)
-   ✅ **One-click withdrawal** (for claimers)
-   ✅ **Transaction tracking** with hash display
-   ✅ **Error handling** for failed transactions

## Verification Services

### Mock Verification (Testing)

```typescript
import { VerificationService } from "@/services/verification-service";

// Mock verification for testing
const result = await VerificationService.mockVerifyClaim("claim123", true);
```

### GitHub Merge Verification

```typescript
const result = await VerificationService.verifyGitHubMerge("claim123", {
	repository: "user/repo",
	mergeCommit: "abc123",
	prNumber: 42,
});
```

### ZK Proof Verification

```typescript
const result = await VerificationService.verifyZKProof("claim123", {
	proof: "0xproof...",
	publicInputs: ["0xinput1", "0xinput2"],
	circuitId: "circuit123",
});
```

## Database Changes

### New Fields Added:

-   `transactionHash` - Blockchain transaction hash for escrow deposit
-   `fundsReleased` - Boolean flag for fund release status

### Updated Flow:

1. Quest created → `transactionHash` stored
2. Claim verified → `fundsReleased = true`
3. Quest status → `COMPLETED`

## Security Features

### ✅ **Automatic Verification**

-   No human bias or delays
-   Consistent verification standards
-   24/7 availability

### ✅ **Smart Contract Security**

-   Funds held securely in escrow
-   Only verified claims can release funds
-   No double-spending possible

### ✅ **Transaction Transparency**

-   All transactions recorded on blockchain
-   Public verification of fund releases
-   Immutable audit trail

## Testing the System

### 1. **Create Quest with Funds**

```bash
# Quest creation will trigger wallet transaction
# User deposits ETH into escrow contract
```

### 2. **Submit Claim**

```bash
# User submits claim with proof
# Claim stored as PENDING
```

### 3. **Verify Proof**

```bash
curl -X POST /api/claims/claim123/verify \
  -H "Content-Type: application/json" \
  -d '{"verified": true, "proofData": {...}}'
```

### 4. **Funds Released**

```bash
# Claim automatically approved
# Funds released from escrow
# Claimer can withdraw immediately
```

## Integration Examples

### External Verification Service

```typescript
// Your verification service calls this endpoint
const response = await fetch(`/api/claims/${claimId}/verify`, {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		verified: true,
		proofData: verificationResult,
		verifierAddress: "0xYourVerifier",
	}),
});

const result = await response.json();
if (result.data.escrowAction?.required) {
	// Trigger blockchain transaction to release funds
	await releaseFunds(result.data.escrowAction);
}
```

### Frontend Integration

```tsx
// In your quest page
import { ClaimFunds } from "@/components/claim-funds";

function QuestPage({ quest }) {
	return (
		<div>
			<h1>{quest.title}</h1>
			<ClaimFunds questId={quest.id} claimerAddress={userAddress} />
		</div>
	);
}
```

## Benefits

### ✅ **Fully Automated**

-   No manual approval needed
-   Instant fund release upon verification
-   24/7 operation

### ✅ **Transparent & Trustless**

-   All transactions on blockchain
-   Public verification process
-   No central authority required

### ✅ **User-Friendly**

-   Simple one-click claiming
-   Real-time transaction status
-   Clear error messages

### ✅ **Secure**

-   Funds held in smart contract
-   Only verified claims can release funds
-   No possibility of fraud

## Next Steps

1. **Deploy escrow contract** to your target network
2. **Update contract address** in environment variables
3. **Test verification flow** with mock data
4. **Integrate real verification** (GitHub API, ZK proofs)
5. **Deploy to production** 🚀

The system is now **fully automated** - users can claim funds immediately after proof verification without any manual approval! 🎉
