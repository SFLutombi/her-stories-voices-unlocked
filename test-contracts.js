import { ethers } from 'ethers';

// Contract ABI (just the functions we need to test)
const SIMPLE_BDAG_TRANSFER_ABI = [
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
  }
];

// Contract address from your config
const CONTRACT_ADDRESS = '0x643859f45cC468e26d98917b086a7B50436f51db';

// RPC URL for Primordial BlockDAG Testnet
const RPC_URL = 'https://rpc.primordial.bdagscan.com';

async function testContract() {
  try {
    console.log('🔍 Testing smart contract connectivity...');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('RPC URL:', RPC_URL);
    console.log('Network: Primordial BlockDAG Testnet');
    console.log('---');
    
    // Create provider (ethers v5 syntax)
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    console.log('✅ Provider created successfully');
    
    // Get network info
    const network = await provider.getNetwork();
    console.log('✅ Network info retrieved:', {
      chainId: network.chainId,
      name: network.name
    });
    
    // Get latest block
    const latestBlock = await provider.getBlockNumber();
    console.log('✅ Latest block number:', latestBlock);
    
    // Test contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, SIMPLE_BDAG_TRANSFER_ABI, provider);
    console.log('✅ Contract instance created');
    
    // Test contract call
    console.log('🔄 Testing contract call (getContractBalance)...');
    const balance = await contract.getContractBalance();
    console.log('✅ Contract call successful!');
    console.log('Contract balance:', balance.toString(), 'wei');
    
    console.log('---');
    console.log('🎉 All tests passed! Your smart contracts are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('---');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check if the RPC URL is accessible');
    console.log('2. Verify the contract address is correct');
    console.log('3. Ensure the contract is deployed on the testnet');
    console.log('4. Check if the testnet is running');
    
    if (error.message.includes('network')) {
      console.log('5. Network connectivity issue detected');
    }
    if (error.message.includes('contract')) {
      console.log('6. Contract interaction issue detected');
    }
  }
}

// Run the test
testContract();
