import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "viem";

export const projectId = "01183905ca682aef294e44b41d7634b3";

if (!projectId) {
	throw new Error("Project ID is not defined");
}

// Define Horizen Testnet (Base Sepolia) network
export const horizonTestnet = defineChain({
	id: 845320009,
	name: "Horizen Testnet",
	nativeCurrency: {
		decimals: 18,
		name: "ETH",
		symbol: "ETH",
	},
	rpcUrls: {
		default: {
			http: ["https://horizen-rpc-testnet.appchain.base.org"],
		},
	},
	blockExplorers: {
		default: {
			name: "Horizen Testnet Explorer",
			url: "https://horizen-explorer-testnet.appchain.base.org",
		},
	},
});

export const networks = [horizonTestnet];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
	storage: createStorage({
		storage: cookieStorage,
	}),
	ssr: true,
	projectId,
	networks,
});

export const config = wagmiAdapter.wagmiConfig;
