# Smart Contract Integration Guide

## 🚀 Overview

The HerStories app has been updated to integrate with deployed smart contracts on the Primordial BlockDAG Testnet. This integration allows authors to create stories on the blockchain while maintaining a synchronized database for fast queries and user experience.

## 🔗 Deployed Contracts

Your smart contracts are deployed at these addresses on Primordial BlockDAG Testnet:

- **Integration Contract**: `0x0fFb51c20FecB3914411f9774ECe1CF1aEB53670`
- **Credits Contract**: `0x4CC3aaE1db9BE1e0c62917c3E85FcdDf5505Ec8E`
- **Payment Contract**: `0xDD1dA7a122dF2FB7429B6fac873D487c3deED7A7`
- **Story Contract**: `0x61E657f127D9F03F5537D2560d5AA77C5aeC9332`

## 📋 Prerequisites

1. **MetaMask Wallet**: Users need MetaMask installed and connected
2. **Primordial BlockDAG Testnet**: Currently configured for Primordial BlockDAG Testnet
3. **Test BDAG Tokens**: Users need some test BDAG tokens for gas fees (get from faucet)

## 🎯 How It Works

### 1. **Story Creation Flow**
```
Author → Dashboard → Create Story → Smart Contract → Database Sync → Discover Page
```

1. Author connects MetaMask wallet
2. Fills out story creation form
3. Story is created on Primordial BlockDAG Testnet via smart contract
4. Story data is synced to Supabase database
5. Story appears on discover page with blockchain verification

### 2. **Data Synchronization**
- **Primary**: Smart contracts store ownership and access control
- **Secondary**: Supabase database stores content and metadata
- **Sync**: Real-time updates between blockchain and database

## 🛠️ Setup Instructions

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Configure Network**
Update `src/integrations/web3/config.ts` with your preferred network:
- **Primordial**: Primordial BlockDAG Testnet (for development and testing)
- **Mainnet**: Ethereum mainnet (for production)

### 3. **Verify Contract Addresses**
Ensure the contract addresses in `src/integrations/web3/config.ts` match your deployed contracts.

### 4. **Start Development Server**
```bash
npm run dev
```

## 🔌 Using the Integration

### **For Authors**

1. **Connect Wallet**
   - Navigate to Dashboard
   - Click "Connect MetaMask"
   - Approve connection in MetaMask

2. **Create Story**
   - Go to "Create" tab
   - Fill out story details
   - Click "Create Story on Blockchain"
   - Confirm transaction in MetaMask

3. **Monitor Status**
   - Green status = Connected and ready
   - Yellow status = Connecting to contracts
   - Orange status = Wallet not connected

### **For Readers**

1. **View Stories**
   - Navigate to Discover page
   - Stories show blockchain verification badges
   - Click "View TX" to see Primordial BlockDAG transaction

2. **Purchase Chapters**
   - Coming soon: Credit-based chapter purchases
   - Coming soon: BDAG-based chapter purchases

## 📊 Database Schema Updates

The following fields have been added to support blockchain integration:

### **Stories Table**
```sql
ALTER TABLE stories ADD COLUMN IF NOT EXISTS blockchain_id TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;
```

### **User Chapter Access Table**
```sql
CREATE TABLE IF NOT EXISTS user_chapter_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  story_id UUID REFERENCES stories(id),
  chapter_id UUID REFERENCES chapters(id),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blockchain_tx_hash TEXT,
  UNIQUE(user_id, story_id, chapter_id)
);
```

## 🔧 Technical Details

### **Smart Contract Functions Used**

#### **Story Creation**
```solidity
function createStoryIntegrated(
  string title,
  string description, 
  string category,
  uint256 pricePerChapter,
  uint256 impactPercentage,
  bool isAnonymous
) external
```

#### **Chapter Addition**
```solidity
function addChapterIntegrated(
  uint256 storyId,
  string title,
  string contentHash,
  uint256 price
) external
```

### **Web3 Integration Points**

1. **Contract Initialization**: `src/integrations/web3/contracts.ts`
2. **Context Management**: `src/contexts/Web3Context.tsx`
3. **Story Sync Service**: `src/services/storySync.ts`
4. **UI Integration**: Dashboard and Discover pages

## 🚨 Troubleshooting

### **Common Issues**

#### **1. MetaMask Not Connected**
- **Symptom**: Orange status card, "Connect Wallet" button
- **Solution**: Click "Connect MetaMask" and approve in wallet

#### **2. Wrong Network**
- **Symptom**: "Please switch to [Network Name]" error
- **Solution**: Switch MetaMask to Primordial BlockDAG Testnet (Chain ID: 1043)

#### **3. Smart Contracts Not Ready**
- **Symptom**: Yellow status card, "Smart Contracts Initializing"
- **Solution**: Wait for contracts to initialize, refresh page if needed

#### **4. Transaction Failed**
- **Symptom**: "Error Creating Story" toast
- **Solution**: Check MetaMask for transaction details, ensure sufficient BDAG tokens for gas

### **Debug Information**

Enable console logging to see detailed Web3 operations:
```javascript
// In browser console
localStorage.setItem('debug', 'web3:*');
```

## 🔮 Future Features

### **Phase 2: Chapter Purchases**
- Credit-based chapter access
- BDAG-based chapter purchases
- Automatic access control

### **Phase 3: Advanced Features**
- Author earnings tracking
- Impact fund distribution
- Reader analytics

### **Phase 4: Optimization**
- Gas fee optimization
- Batch transactions
- Layer 2 scaling

## 📚 API Reference

### **Web3 Context Hook**
```typescript
const { 
  isConnected, 
  connect, 
  account, 
  network, 
  contractsInitialized 
} = useWeb3();
```

### **Story Sync Service**
```typescript
import { createStory, addChapter, publishStory } from '@/services/storySync';

// Create story
const result = await createStory(storyData, authorId, walletAddress);

// Add chapter
const result = await addChapter(storyId, chapterData, walletAddress);

// Publish story
const result = await publishStory(storyId, authorId);
```

## 🎉 Success Metrics

- ✅ Stories created on Primordial BlockDAG Testnet
- ✅ Database synchronization working
- ✅ Discover page showing blockchain stories
- ✅ MetaMask integration functional
- ✅ Transaction history visible on Primordial BlockDAG explorer

## 🆘 Support

If you encounter issues:

1. Check browser console for error messages
2. Verify MetaMask network settings (should be Primordial BlockDAG Testnet)
3. Ensure sufficient test BDAG token balance (use faucet if needed)
4. Check contract deployment status on Primordial BlockDAG
5. Review smart contract logs

## 🔄 Updates

This integration will be updated as new features are added. Check the repository for the latest version and changelog.

## 🌐 Primordial BlockDAG Testnet Resources

- **Network Name**: Primordial BlockDAG Testnet
- **Chain ID**: 1043 (0x413 in hex)
- **RPC URL**: https://rpc.primordial.bdagscan.com
- **Explorer**: https://primordial.bdagscan.com
- **Currency Symbol**: BDAG
- **Faucet**: https://primordial.bdagscan.com/faucet

## 📱 MetaMask Network Setup

To add Primordial BlockDAG Testnet to MetaMask:

1. Open MetaMask
2. Click on the network dropdown
3. Select "Add Network"
4. Fill in the details:
   - **Network Name**: Primordial BlockDAG Testnet
   - **New RPC URL**: https://rpc.primordial.bdagscan.com
   - **Chain ID**: 1043
   - **Currency Symbol**: BDAG
   - **Block Explorer URL**: https://primordial.bdagscan.com
5. Click "Save"
6. Get test BDAG tokens from the faucet: https://primordial.bdagscan.com/faucet
