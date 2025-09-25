import { ethers } from "hardhat";

async function main() {
	console.log("Deploying QuestEscrow contract...");

	// Get the contract factory
	const QuestEscrow = await ethers.getContractFactory("QuestEscrow");

	// Deploy the contract
	const questEscrow = await QuestEscrow.deploy();

	// Wait for deployment to complete
	await questEscrow.waitForDeployment();

	const contractAddress = await questEscrow.getAddress();

	console.log("✅ QuestEscrow deployed successfully!");
	console.log("📋 Contract Address:", contractAddress);
	console.log(
		"🌐 Network:",
		await questEscrow.runner?.provider?.getNetwork()
	);

	// Verify deployment
	console.log("\n🔍 Verifying deployment...");
	const questCount = await questEscrow.getBalance(contractAddress);
	console.log("Contract balance:", ethers.formatEther(questCount), "ETH");

	console.log("\n📝 Next steps:");
	console.log("1. Copy the contract address above");
	console.log("2. Add it to your .env.local file:");
	console.log(`   NEXT_PUBLIC_QUEST_ESCROW_ADDRESS=${contractAddress}`);
	console.log("3. Update your frontend to use this address");

	// Save deployment info
	const deploymentInfo = {
		contractAddress,
		network: await questEscrow.runner?.provider?.getNetwork(),
		deployer: await questEscrow.runner?.getAddress(),
		timestamp: new Date().toISOString(),
	};

	console.log("\n💾 Deployment info saved to deployment.json");
	require("fs").writeFileSync(
		"deployment.json",
		JSON.stringify(deploymentInfo, null, 2)
	);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Deployment failed:", error);
		process.exit(1);
	});
