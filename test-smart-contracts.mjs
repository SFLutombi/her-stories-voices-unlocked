import { ethers } from 'ethers';

// More comprehensive contract ABI with multiple functions to test
const SIMPLE_BDAG_TRANSFER_ABI = [
  // Basic info functions
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Try to get contract owner or basic info
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Try to get total supply or similar
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Try to get any public variable
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Try to get contract version
  {
    "inputs": [],
    "name": "version",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
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
    
    // Test multiple contract functions to find one that works
    console.log('🔄 Testing multiple contract functions...');
    
    const functionsToTest = [
      'getContractBalance',
      'owner', 
      'totalSupply',
      'name',
      'version'
    ];
    
    let workingFunction = null;
    
    for (const funcName of functionsToTest) {
      try {
        console.log(`  Testing ${funcName}...`);
        const result = await contract[funcName]();
        console.log(`  ✅ ${funcName} successful:`, result.toString());
        workingFunction = funcName;
        break;
      } catch (error) {
        console.log(`  ❌ ${funcName} failed:`, error.message);
      }
    }
    
    if (workingFunction) {
      console.log('---');
      console.log('🎉 Contract is working! Found working function:', workingFunction);
      console.log('The issue is likely with the specific getContractBalance function.');
    } else {
      console.log('---');
      console.log('❌ All tested functions failed. This suggests:');
      console.log('1. The contract ABI is incorrect');
      console.log('2. The contract is not fully deployed');
      console.log('3. The contract has different function names');
    }
    
    // Try to get contract code to verify deployment
    console.log('---');
    console.log('🔍 Checking contract deployment...');
    try {
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        console.log('❌ No contract code found at this address');
      } else {
        console.log('✅ Contract code found (length:', code.length, 'characters)');
        console.log('Contract is deployed but may have different interface');
      }
    } catch (error) {
      console.log('❌ Failed to get contract code:', error.message);
    }
    
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
