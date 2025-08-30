# HerStories Smart Contracts

This directory contains the smart contracts for the HerStories platform, enabling blockchain-based payments, credit management, and story publishing.

## 🏗️ **Contract Architecture**

### **Core Contracts**

1. **`HerStoriesPayment.sol`** - Main payment processing contract
2. **`HerStoriesCredits.sol`** - ERC20 credit token contract
3. **`HerStoriesStory.sol`** - Story and chapter management contract
4. **`HerStoriesIntegration.sol`** - Unified interface connecting all contracts

### **Contract Dependencies**

All contracts use OpenZeppelin libraries for security and best practices:
- `@openzeppelin/contracts/security/ReentrancyGuard.sol`
- `@openzeppelin/contracts/access/Ownable.sol`
- `@openzeppelin/contracts/token/ERC20/ERC20.sol`
- `@openzeppelin/contracts/security/Pausable.sol`
- `@openzeppelin/contracts/utils/Counters.sol`

## 🚀 **Deployment Instructions**

### **Step 1: Prepare BlockDAG IDE**

1. Go to [BlockDAG IDE](https://ide.blockdag.com/)
2. Create a new project
3. Set compiler version to **Solidity 0.8.19**
4. Enable optimization with **200 runs**

### **Step 2: Deploy Contracts in Order**

#### **1. Deploy HerStoriesCredits First**
```solidity
// Copy and paste HerStoriesCredits.sol
// Deploy with your wallet address as owner
// Save the deployed contract address
```

#### **2. Deploy HerStoriesPayment**
```solidity
// Copy and paste HerStoriesPayment.sol
// Deploy with your wallet address as owner
// Save the deployed contract address
```

#### **3. Deploy HerStoriesStory**
```solidity
// Copy and paste HerStoriesStory.sol
// Deploy with your wallet address as owner
// Save the deployed contract address
```

#### **4. Deploy HerStoriesIntegration**
```solidity
// Copy and paste HerStoriesIntegration.sol
// Deploy with your wallet address as owner
// Save the deployed contract address
```

### **Step 3: Initialize Integration Contract**

After deploying all contracts, call the `initializeContracts` function on `HerStoriesIntegration`:

```solidity
// Function: initializeContracts
// Parameters:
// _paymentContract: [HerStoriesPayment address]
// _creditsContract: [HerStoriesCredits address]
// _storyContract: [HerStoriesStory address]
```

## 🔧 **Contract Functions & Features**

### **HerStoriesPayment.sol**
- **`purchaseStory()`** - Buy story chapters with ETH
- **`sendTip()`** - Tip authors with ETH
- **`makeDonation()`** - Donate to women's shelters
- **`registerAuthor()`** - Register as an author
- **`updateImpactPercentage()`** - Set impact percentage

### **HerStoriesCredits.sol**
- **`purchaseCredits()`** - Buy credits with ETH
- **`redeemCredits()`** - Convert credits back to ETH
- **`transferCredits()`** - Send credits to other users
- **`earnCredits()`** - Receive credits from story sales

### **HerStoriesStory.sol**
- **`createStory()`** - Create new stories
- **`addChapter()`** - Add chapters to stories
- **`purchaseChapter()`** - Buy access to chapters
- **`hasChapterAccess()`** - Check chapter access

### **HerStoriesIntegration.sol**
- **`purchaseStoryWithCredits()`** - Buy stories using credits
- **`purchaseStoryWithETH()`** - Buy stories using ETH
- **`getUserProfile()`** - Get complete user information
- **`getStoryInfo()`** - Get story details

## 💰 **Payment Flow**

### **Story Purchase with Credits**
1. User calls `purchaseStoryWithCredits()` on Integration contract
2. Credits are transferred from buyer to author
3. Author's credit balance is updated
4. Transaction is recorded

### **Story Purchase with ETH**
1. User calls `purchaseStoryWithETH()` on Integration contract
2. ETH is sent to Payment contract
3. Platform fee (2.5%) is deducted
4. Impact percentage goes to shelters
5. Remaining amount goes to author

### **Credit System**
1. Users purchase credits with ETH (1 credit = 0.001 ETH)
2. Credits can be used for story purchases
3. Credits can be transferred between users
4. Credits can be redeemed for ETH

## 🛡️ **Security Features**

- **ReentrancyGuard** - Prevents reentrancy attacks
- **Ownable** - Access control for admin functions
- **Pausable** - Emergency pause functionality
- **Input Validation** - Comprehensive parameter checking
- **Safe Math** - Built-in overflow protection (Solidity 0.8+)

## 📊 **Platform Economics**

- **Platform Fee**: 2.5% on all transactions
- **Impact Percentage**: 0-50% (set by authors) goes to women's shelters
- **Author Earnings**: Remaining amount after fees and impact
- **Credit Price**: 1 credit = 0.001 ETH (adjustable by owner)

## 🔗 **Frontend Integration**

### **Web3 Connection**
```javascript
// Connect to MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, abi, signer);
```

### **Key Functions to Call**
```javascript
// Purchase story with credits
await integrationContract.purchaseStoryWithCredits(storyId, chapterId, author, amount);

// Purchase story with ETH
await integrationContract.purchaseStoryWithETH(storyId, chapterId, author, { value: amount });

// Get user profile
const profile = await integrationContract.getUserProfile(userAddress);

// Check chapter access
const hasAccess = await integrationContract.hasChapterAccess(userAddress, storyId, chapterId);
```

## 🚨 **Important Notes**

### **Deployment Order**
1. **Credits** contract must be deployed first
2. **Payment** and **Story** contracts can be deployed in parallel
3. **Integration** contract must be deployed last
4. **Integration** contract must be initialized with other contract addresses

### **Gas Requirements**
- **Deployment**: ~2-5 million gas per contract
- **Story Creation**: ~100,000-200,000 gas
- **Chapter Addition**: ~50,000-100,000 gas
- **Story Purchase**: ~80,000-150,000 gas

### **Network Considerations**
- **Testnet**: Deploy on Sepolia or Goerli first
- **Mainnet**: Ensure sufficient ETH for deployment
- **Gas Optimization**: Use appropriate gas limits

## 🧪 **Testing**

### **Test Scenarios**
1. **Author Registration** - Register as an author
2. **Story Creation** - Create a new story
3. **Chapter Addition** - Add chapters to stories
4. **Story Purchase** - Buy access to chapters
5. **Credit System** - Purchase, transfer, and redeem credits
6. **Payment Processing** - Verify fee distribution

### **Test Data**
- **Story Title**: "Test Story"
- **Description**: "A test story for development"
- **Category**: "Fiction"
- **Price**: 0.001 ETH (1 credit)
- **Impact**: 10%

## 📞 **Support**

For deployment issues or questions:
1. Check BlockDAG IDE documentation
2. Verify Solidity compiler version (0.8.19)
3. Ensure all dependencies are imported correctly
4. Check gas limits and network configuration

## 🎯 **Next Steps After Deployment**

1. **Test all functions** on testnet
2. **Update frontend** with contract addresses
3. **Configure MetaMask** for your network
4. **Test user flows** end-to-end
5. **Deploy to mainnet** when ready

---

**Happy Deploying! 🚀**
