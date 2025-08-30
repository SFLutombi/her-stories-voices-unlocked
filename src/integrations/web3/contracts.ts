import { ethers } from 'ethers';
import { WEB3_CONFIG, getCurrentNetwork, getContractAddress } from './config';

// Contract ABIs - these should match your deployed contracts
// For now, using simplified interfaces - you'll need to import the actual ABIs
const INTEGRATION_ABI = [
  'function purchaseStoryWithCredits(uint256 storyId, uint256 chapterId, address author, uint256 amount) external',
  'function purchaseStoryWithETH(uint256 storyId, uint256 chapterId, address author) external payable',
  'function sendTipWithCredits(address author, uint256 amount) external',
  'function sendTipWithETH(address author) external payable',
  'function purchaseCredits(uint256 creditAmount) external payable',
  'function redeemCredits(uint256 amount) external',
  'function createStoryIntegrated(string title, string description, string category, uint256 pricePerChapter, uint256 impactPercentage, bool isAnonymous) external',
  'function addChapterIntegrated(uint256 storyId, string title, string contentHash, uint256 price) external',
  'function getUserProfile(address user) external view returns (uint256 creditBalance, uint256 totalEarnings, uint256 totalStories, uint256 totalChapters, uint256 totalReaders)',
  'function getStoryInfo(uint256 storyId) external view returns (address author, string title, string description, uint256 pricePerChapter, uint256 impactPercentage, uint256 totalChapters, uint256 totalReaders, uint256 totalEarnings, bool isPublished)',
  'function hasChapterAccess(address user, uint256 storyId, uint256 chapterId) external view returns (bool)',
  'function getUserPurchaseHistory(address user) external view returns (tuple(uint256 storyId, uint256 chapterId, address buyer, uint256 amount, uint256 timestamp, bool isActive)[], uint256[])',
  'function getIntegrationStatus() external view returns (bool initialized, bool paymentLinked, bool creditsLinked, bool storyLinked)',
  'function getContractAddresses() external view returns (address payment, address credits, address story)'
];

const CREDITS_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function purchaseCredits(uint256 amount) external payable',
  'function redeemCredits(uint256 amount) external',
  'function earnCredits(address user, uint256 amount, string memory metadata) external',
  'function getUserCreditBalance(address user) external view returns (uint256)',
  'function getUserTransactions(address user) external view returns (uint256[])'
];

const PAYMENT_ABI = [
  'function purchaseStory(address to, string memory storyId, string memory chapterId, uint256 amount) external payable',
  'function sendTip(address to, uint256 amount) external payable',
  'function makeDonation(uint256 amount) external payable',
  'function registerAuthor(address author, string memory pseudonym, uint256 impactPercentage) external',
  'function updateImpactPercentage(uint256 newPercentage) external',
  'function withdrawImpactFunds() external',
  'function getAuthorProfile(address author) external view returns (tuple(string pseudonym, uint256 impactPercentage, uint256 totalEarnings, uint256 totalStories, uint256 totalChapters, uint256 totalReaders, bool isActive, uint256 createdAt))',
  'function getPaymentHistory(address user) external view returns (tuple(uint256 id, address from, address to, uint256 amount, uint256 timestamp, uint8 paymentType, uint8 status, string metadata)[])',
  'function emergencyPause() external',
  'function emergencyUnpause() external'
];

const STORY_ABI = [
  'function registerAuthor(string memory pseudonym, uint256 impactPercentage) external',
  'function createStory(string memory title, string memory description, string memory category, uint256 pricePerChapter, uint256 impactPercentage, bool isAnonymous) external',
  'function addChapter(uint256 storyId, string memory title, string memory contentHash, uint256 price) external',
  'function purchaseChapter(uint256 storyId, uint256 chapterId) external payable',
  'function updateStory(uint256 storyId, string memory title, string memory description, uint256 pricePerChapter, uint256 impactPercentage) external',
  'function setStoryPublished(uint256 storyId, bool isPublished) external',
  'function setChapterPublished(uint256 chapterId, bool isPublished) external',
  'function hasChapterAccess(address user, uint256 storyId, uint256 chapterId) external view returns (bool)',
  'function getStory(uint256 storyId) external view returns (tuple(uint256 id, address author, string title, string description, string category, uint256 pricePerChapter, uint256 impactPercentage, uint256 totalChapters, uint256 totalReaders, uint256 totalEarnings, bool isPublished, bool isAnonymous, uint256 createdAt, uint256 updatedAt))',
  'function getChapter(uint256 chapterId) external view returns (tuple(uint256 id, uint256 storyId, string title, string contentHash, uint256 price, bool isPublished, uint256 createdAt, uint256 updatedAt))',
  'function getAuthorProfile(address author) external view returns (tuple(address author, string pseudonym, uint256 impactPercentage, uint256 totalStories, uint256 totalChapters, uint256 totalReaders, uint256 totalEarnings, bool isActive, uint256 createdAt))',
  'function getAuthorStories(address author) external view returns (uint256[])',
  'function getStoryChapters(uint256 storyId) external view returns (uint256[])',
  'function getUserPurchases(address user) external view returns (tuple(uint256 storyId, uint256 chapterId, address buyer, uint256 amount, uint256 timestamp, bool isActive)[])',
  'function getChapterReaders(uint256 storyId, uint256 chapterId) external view returns (address[])',
  'function pause() external',
  'function unpause() external'
];

// Web3 provider and signer
let provider: ethers.providers.Web3Provider | null = null;
let signer: ethers.Signer | null = null;

// Contract instances
let integrationContract: ethers.Contract | null = null;
let creditsContract: ethers.Contract | null = null;
let paymentContract: ethers.Contract | null = null;
let storyContract: ethers.Contract | null = null;

/**
 * Initialize Web3 connection
 */
export const initializeWeb3 = async (): Promise<boolean> => {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    // Get current network
    const network = await provider.getNetwork();
    const currentNetwork = getCurrentNetwork();
    
    // Check if we're on the correct network
    // Convert chainId to decimal for comparison
    const expectedChainId = parseInt(currentNetwork.chainId, 16);
    if (network.chainId !== expectedChainId) {
      console.log(`Current chain ID: ${network.chainId}, Expected: ${expectedChainId}`);
      console.log(`Current network: ${network.name}, Expected: ${currentNetwork.name}`);
      
      // Automatically try to switch to the correct network
      console.log('Attempting to automatically switch to Primordial BlockDAG Testnet...');
      const switchSuccess = await addAndSwitchToPrimordialTestnet();
      
      if (switchSuccess) {
        // Wait a moment for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we're now on the correct network
        const newNetwork = await provider.getNetwork();
        if (newNetwork.chainId === expectedChainId) {
          console.log('Successfully switched to Primordial BlockDAG Testnet');
        } else {
          throw new Error(`Please switch to ${currentNetwork.name} in MetaMask`);
        }
      } else {
        throw new Error(`Please switch to ${currentNetwork.name} in MetaMask`);
      }
    }

    // Initialize contracts
    await initializeContracts();

    console.log('Web3 initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    return false;
  }
};

/**
 * Initialize contract instances
 */
const initializeContracts = async () => {
  if (!signer) throw new Error('Signer not initialized');

  const addresses = getCurrentNetwork().contracts;

  integrationContract = new ethers.Contract(
    addresses.integration,
    INTEGRATION_ABI,
    signer
  );

  creditsContract = new ethers.Contract(
    addresses.credits,
    CREDITS_ABI,
    signer
  );

  paymentContract = new ethers.Contract(
    addresses.payment,
    PAYMENT_ABI,
    signer
  );

  storyContract = new ethers.Contract(
    addresses.story,
    STORY_ABI,
    signer
  );
};

/**
 * Get current account address
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    if (!provider) return null;
    const accounts = await provider.listAccounts();
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to get current account:', error);
    return null;
  }
};

/**
 * Switch network
 */
export const switchNetwork = async (networkName: 'mainnet' | 'testnet'): Promise<boolean> => {
  try {
    const network = WEB3_CONFIG.networks[networkName];
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    });
    return true;
  } catch (error) {
    console.error('Failed to switch network:', error);
    return false;
  }
};

/**
 * Add Primordial BlockDAG Testnet to MetaMask and switch to it
 */
export const addAndSwitchToPrimordialTestnet = async (): Promise<boolean> => {
  try {
    const network = WEB3_CONFIG.networks.primordial;
    
    // Try to switch to the network first
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
      console.log('Successfully switched to Primordial BlockDAG Testnet');
      return true;
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        console.log('Primordial BlockDAG Testnet not found, adding it to MetaMask...');
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: network.chainId,
            chainName: network.name,
            nativeCurrency: {
              name: 'BDAG',
              symbol: network.currencySymbol,
              decimals: 18
            },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
            iconUrls: ['https://primordial.bdagscan.com/favicon.ico'] // Optional: add favicon
          }]
        });
        
        console.log('Successfully added Primordial BlockDAG Testnet to MetaMask');
        return true;
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error('Failed to add/switch to Primordial BlockDAG Testnet:', error);
    return false;
  }
};

/**
 * Smart Contract Functions
 */

// Story Management
export const createStoryOnChain = async (
  title: string,
  description: string,
  category: string,
  pricePerChapter: number,
  impactPercentage: number,
  isAnonymous: boolean
) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.createStoryIntegrated(
    title,
    description,
    category,
    ethers.utils.parseEther(pricePerChapter.toString()),
    impactPercentage,
    isAnonymous
  );
  
  return await tx.wait();
};

export const addChapterOnChain = async (
  storyId: number,
  title: string,
  contentHash: string,
  price: number
) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.addChapterIntegrated(
    storyId,
    title,
    contentHash,
    ethers.utils.parseEther(price.toString())
  );
  
  return await tx.wait();
};

// Credit Management
export const purchaseCredits = async (amount: number) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const price = amount * 0.001; // 1 credit = 0.001 ETH
  const tx = await integrationContract.purchaseCredits(amount, {
    value: ethers.utils.parseEther(price.toString())
  });
  
  return await tx.wait();
};

export const redeemCredits = async (amount: number) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.redeemCredits(amount);
  return await tx.wait();
};

export const getCreditBalance = async (address: string): Promise<number> => {
  if (!creditsContract) throw new Error('Contracts not initialized');
  
  const balance = await creditsContract.balanceOf(address);
  return parseFloat(ethers.utils.formatEther(balance));
};

// Story Purchases
export const purchaseChapterWithCredits = async (
  storyId: number,
  chapterId: number,
  author: string,
  amount: number
) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.purchaseStoryWithCredits(
    storyId,
    chapterId,
    author,
    amount
  );
  
  return await tx.wait();
};

export const purchaseChapterWithETH = async (
  storyId: number,
  chapterId: number,
  author: string,
  amount: number
) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.purchaseStoryWithETH(
    storyId,
    chapterId,
    author,
    {
      value: ethers.utils.parseEther(amount.toString())
    }
  );
  
  return await tx.wait();
};

// Tips and Donations
export const sendTipWithCredits = async (author: string, amount: number) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.sendTipWithCredits(author, amount);
  return await tx.wait();
};

export const sendTipWithETH = async (author: string, amount: number) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  const tx = await integrationContract.sendTipWithETH(author, {
    value: ethers.utils.parseEther(amount.toString())
  });
  
  return await tx.wait();
};

// Access Control
export const checkChapterAccess = async (
  user: string,
  storyId: number,
  chapterId: number
): Promise<boolean> => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  return await integrationContract.hasChapterAccess(user, storyId, chapterId);
};

// User Profile
export const getUserProfileOnChain = async (user: string) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  return await integrationContract.getUserProfile(user);
};

// Story Information
export const getStoryInfoOnChain = async (storyId: number) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  return await integrationContract.getStoryInfo(storyId);
};

// Purchase History
export const getUserPurchaseHistoryOnChain = async (user: string) => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  return await integrationContract.getUserPurchaseHistory(user);
};

// Contract Status
export const getContractStatus = async () => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  return await integrationContract.getIntegrationStatus();
};

export const getContractAddresses = async () => {
  if (!integrationContract) throw new Error('Contracts not initialized');
  
  return await integrationContract.getContractAddresses();
};

// Export contract instances for direct access if needed
export {
  integrationContract,
  creditsContract,
  paymentContract,
  storyContract,
  provider,
  signer
};
