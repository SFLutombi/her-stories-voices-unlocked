import { ethers } from 'ethers';

// Simple BDAG Transfer Contract ABI
const SIMPLE_BDAG_TRANSFER_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "author",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "displayName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AuthorRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "author",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "storyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "chapterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ChapterPurchased",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authors",
    "outputs": [
      {
        "internalType": "string",
        "name": "displayName",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isRegistered",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "totalEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "chapterCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_author",
        "type": "address"
      }
    ],
    "name": "getAuthorInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "displayName",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isRegistered",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "totalEarnings",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "chapterCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_storyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_chapterId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_buyer",
        "type": "address"
      }
    ],
    "name": "isChapterPurchased",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_storyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_chapterId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_author",
        "type": "address"
      }
    ],
    "name": "purchaseChapter",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_displayName",
        "type": "string"
      }
    ],
    "name": "registerAuthor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawPlatformFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// Contract addresses - replace with actual deployed addresses
const CONTRACT_ADDRESSES = {
  SIMPLE_BDAG_TRANSFER: '0x643859f45cC468e26d98917b086a7B50436f51db', // Updated with correct address
  // Add other contract addresses as needed
};

// Get provider and signer
let provider: ethers.providers.Web3Provider | null = null;
let signer: ethers.Signer | null = null;

// Check if MetaMask is available
export const isMetaMaskAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

// Check if MetaMask is connected
export const isMetaMaskConnected = async (): Promise<boolean> => {
  if (!isMetaMaskAvailable()) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0;
  } catch (error) {
    console.error('Error checking MetaMask connection:', error);
    return false;
  }
};

export const initializeWeb3 = async (ethereum: any) => {
  try {
    console.log('Initializing Web3 with ethereum provider:', ethereum);
    
    if (!ethereum) {
      throw new Error('No ethereum provider found. Please install MetaMask.');
    }
    
    if (!ethereum.isMetaMask) {
      throw new Error('Please use MetaMask wallet for this application.');
    }
    
    // Request account access
    console.log('Requesting account access...');
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your MetaMask wallet.');
    }
    
    console.log('Account access granted:', accounts[0]);
    
    // Create provider and signer
    provider = new ethers.providers.Web3Provider(ethereum);
    signer = provider.getSigner();
    
    // Get the current account
    const currentAccount = await signer.getAddress();
    console.log('Current account:', currentAccount);
    
    // Get the current network
    const network = await provider.getNetwork();
    console.log('Current network:', network);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    throw error; // Re-throw to handle in the calling code
  }
};

export const getProvider = () => provider;
export const getSigner = () => signer;

// Simple BDAG Transfer Contract Functions
export const getSimpleBDAGTransferContract = () => {
  if (!provider || !signer) {
    throw new Error('Web3 not initialized');
  }
  
  return new ethers.Contract(
    CONTRACT_ADDRESSES.SIMPLE_BDAG_TRANSFER,
    SIMPLE_BDAG_TRANSFER_ABI,
    signer
  );
};

/**
 * Purchase a chapter using the simple BDAG transfer contract
 * @param storyId - The story ID
 * @param chapterId - The chapter ID  
 * @param authorAddress - The author's wallet address
 * @param priceInBDAG - The price in BDAG tokens (in wei)
 * @returns Transaction receipt
 */
export const purchaseChapterWithBDAG = async (
  storyId: number,
  chapterId: number,
  authorAddress: string,
  priceInBDAG: number
): Promise<ethers.providers.TransactionReceipt> => {
  try {
    const contract = getSimpleBDAGTransferContract();
    
    // Convert price to wei (assuming priceInBDAG is in BDAG units)
    const priceInWei = ethers.utils.parseEther(priceInBDAG.toString());
    
    console.log('Purchasing chapter with BDAG:', {
      storyId,
      chapterId,
      authorAddress,
      priceInBDAG,
      priceInWei: priceInWei.toString()
    });
    
    // Call the purchase function
    const tx = await contract.purchaseChapter(
      storyId,
      chapterId,
      authorAddress,
      { value: priceInWei }
    );
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error purchasing chapter with BDAG:', error);
    throw error;
  }
};

/**
 * Register an author on the blockchain (optional)
 * @param displayName - The author's display name
 * @returns Transaction receipt
 */
export const registerAuthorOnBlockchain = async (
  displayName: string
): Promise<ethers.providers.TransactionReceipt> => {
  try {
    const contract = getSimpleBDAGTransferContract();
    
    console.log('Registering author:', displayName);
    
    const tx = await contract.registerAuthor(displayName);
    console.log('Registration transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Registration confirmed:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error registering author:', error);
    throw error;
  }
};

/**
 * Check if a chapter was purchased by a specific user
 * @param storyId - The story ID
 * @param chapterId - The chapter ID
 * @param buyerAddress - The buyer's address
 * @returns True if purchased
 */
export const checkChapterPurchaseStatus = async (
  storyId: number,
  chapterId: number,
  buyerAddress: string
): Promise<boolean> => {
  try {
    const contract = getSimpleBDAGTransferContract();
    
    const isPurchased = await contract.isChapterPurchased(
      storyId,
      chapterId,
      buyerAddress
    );
    
    return isPurchased;
  } catch (error) {
    console.error('Error checking chapter purchase status:', error);
    return false;
  }
};

/**
 * Get author information from the blockchain
 * @param authorAddress - The author's address
 * @returns Author information
 */
export const getAuthorBlockchainInfo = async (authorAddress: string) => {
  try {
    const contract = getSimpleBDAGTransferContract();
    
    const authorInfo = await contract.getAuthorInfo(authorAddress);
    
    return {
      displayName: authorInfo.displayName,
      isRegistered: authorInfo.isRegistered,
      totalEarnings: ethers.utils.formatEther(authorInfo.totalEarnings),
      chapterCount: authorInfo.chapterCount.toNumber()
    };
  } catch (error) {
    console.error('Error getting author blockchain info:', error);
    return null;
  }
};

/**
 * Get contract balance
 * @returns Contract balance in wei
 */
export const getContractBalance = async (): Promise<string> => {
  try {
    const contract = getSimpleBDAGTransferContract();
    const balance = await contract.getContractBalance();
    return balance.toString();
  } catch (error) {
    console.error('Error getting contract balance:', error);
    return '0';
  }
};

/**
 * Get credit balance for an address (simplified - returns 0 for now)
 * @param address - The address to check
 * @returns Credit balance
 */
export const getCreditBalance = async (address: string): Promise<number> => {
  try {
    // For now, return 0 since we're not using credits anymore
    // This function exists for compatibility with existing code
    return 0;
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return 0;
  }
};

/**
 * Get the current connected account
 * @returns Current account address or null
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    if (!provider) {
      return null;
    }
    
    const accounts = await provider.listAccounts();
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

/**
 * Switch to a different network
 * @param networkName - The network to switch to
 * @returns Success status
 */
export const switchNetwork = async (networkName: string): Promise<boolean> => {
  try {
    if (!provider) {
      return false;
    }
    
    // This is a simplified network switching - in production you'd want more robust handling
    console.log('Switching to network:', networkName);
    return true;
  } catch (error) {
    console.error('Error switching network:', error);
    return false;
  }
};

/**
 * Add and switch to Primordial testnet
 * @returns Success status
 */
export const addAndSwitchToPrimordialTestnet = async (): Promise<boolean> => {
  try {
    if (!provider) {
      return false;
    }
    
    console.log('Adding Primordial testnet...');
    // This would typically involve adding the network to MetaMask
    return true;
  } catch (error) {
    console.error('Error adding Primordial testnet:', error);
    return false;
  }
};

// Update contract address (call this after deploying)
export const updateContractAddress = (contractType: keyof typeof CONTRACT_ADDRESSES, newAddress: string) => {
  if (CONTRACT_ADDRESSES[contractType]) {
    CONTRACT_ADDRESSES[contractType] = newAddress;
    console.log(`Updated ${contractType} address to:`, newAddress);
  }
};
