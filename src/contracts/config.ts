import QuestEscrowABI from "./QuestEscrow.json";

// Contract configuration
export const QUEST_ESCROW_CONFIG = {
	// You'll need to deploy the contract and update this address
	address:
		(process.env.NEXT_PUBLIC_QUEST_ESCROW_ADDRESS as `0x${string}`) ||
		"0x0000000000000000000000000000000000000000",
	abi: QuestEscrowABI.abi,
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
	horizen: {
		id: 845320009,
		name: "Horizen Testnet",
		network: "horizen",
		nativeCurrency: {
			decimals: 18,
			name: "Ethereum",
			symbol: "ETH",
		},
		rpcUrls: {
			public: { http: ["https://horizen-rpc-testnet.appchain.base.org"] },
			default: {
				http: ["https://horizen-rpc-testnet.appchain.base.org"],
			},
		},
		blockExplorers: {
			default: {
				name: "Horizen Explorer",
				url: "https://horizen-explorer-testnet.appchain.base.org",
			},
		},
	},
	sepolia: {
		id: 11155111,
		name: "Sepolia",
		network: "sepolia",
		nativeCurrency: {
			decimals: 18,
			name: "Ethereum",
			symbol: "ETH",
		},
		rpcUrls: {
			public: { http: ["https://rpc.sepolia.org"] },
			default: { http: ["https://rpc.sepolia.org"] },
		},
		blockExplorers: {
			default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
		},
	},
	localhost: {
		id: 31337,
		name: "Localhost",
		network: "localhost",
		nativeCurrency: {
			decimals: 18,
			name: "Ethereum",
			symbol: "ETH",
		},
		rpcUrls: {
			public: { http: ["http://127.0.0.1:8545"] },
			default: { http: ["http://127.0.0.1:8545"] },
		},
	},
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;
