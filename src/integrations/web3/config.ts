// Web3 configuration for HerStories smart contracts
export const WEB3_CONFIG = {
  // Network configuration
  networks: {
    // Primordial BlockDAG Testnet configuration
    primordial: {
      chainId: '0x413', // Primordial BlockDAG Testnet chain ID: 1043
      name: 'Primordial BlockDAG Testnet',
      rpcUrl: 'https://rpc.primordial.bdagscan.com',
      blockExplorer: 'https://primordial.bdagscan.com',
      currencySymbol: 'BDAG',
      faucet: 'https://primordial.bdagscan.com/faucet',
      contracts: {
        simpleBDAGTransfer: '0x643859f45cC468e26d98917b086a7B50436f51db',
        integration: '0x0fFb51c20FecB3914411f9774ECe1CF1aEB53670',
        credits: '0x4CC3aaE1db9BE1e0c62917c3E85FcdDf5505Ec8E',
        payment: '0xDD1dA7a122dF2FB7429B6fac873D487c3deED7A7',
        story: '0x61E657f127D9F03F5537D2560d5AA77C5aeC9332',
      }
    },
    // Ethereum mainnet configuration (for production)
    mainnet: {
      chainId: '0x1', // Ethereum mainnet
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // Replace with your RPC URL
      blockExplorer: 'https://etherscan.io',
      contracts: {
        simpleBDAGTransfer: '0x643859f45cC468e26d98917b086a7B50436f51db',
        integration: '0x0fFb51c20FecB3914411f9774ECe1CF1aEB53670',
        credits: '0x4CC3aaE1db9BE1e0c62917c3E85FcdDf5505Ec8E',
        payment: '0xDD1dA7a122dF2FB7429B6fac873D487c3deED7A7',
        story: '0x61E657f127D9F03F5537D2560d5AA77C5aeC9332',
      }
    }
  },
  
  // Default network - using Primordial BlockDAG Testnet for development
  defaultNetwork: 'primordial',
  
  // Contract ABIs (these will be imported from the contracts folder)
  abis: {
    integration: 'HerStoriesIntegration',
    credits: 'HerStoriesCredits',
    payment: 'HerStoriesPayment',
    story: 'HerStoriesStory'
  }
};

// Helper function to get current network config
export const getCurrentNetwork = () => {
  return WEB3_CONFIG.networks[WEB3_CONFIG.defaultNetwork as keyof typeof WEB3_CONFIG.networks];
};

// Helper function to get contract addresses
export const getContractAddresses = () => {
  return getCurrentNetwork().contracts;
};

// Helper function to get contract address by name
export const getContractAddress = (contractName: keyof typeof WEB3_CONFIG.abis) => {
  return getCurrentNetwork().contracts[contractName];
};
