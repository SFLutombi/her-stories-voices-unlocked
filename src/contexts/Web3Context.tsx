import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { 
  initializeWeb3, 
  getCurrentAccount, 
  switchNetwork,
  getContractBalance,
  getAuthorBlockchainInfo,
  updateContractAddress,
  isMetaMaskAvailable,
  isMetaMaskConnected
} from '@/integrations/web3/contracts';
import { WEB3_CONFIG, getCurrentNetwork } from '@/integrations/web3/config';

interface Web3ContextType {
  // Connection state
  isConnected: boolean;
  isInitializing: boolean;
  isWeb3Initialized: boolean;
  account: string | null;
  network: string | null;
  
  // Contract state
  contractsInitialized: boolean;
  contractAddresses: {
    simpleBDAGTransfer: string;
  } | null;
  
  // Functions
  connect: () => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: (networkName: 'mainnet' | 'testnet') => Promise<boolean>;
  getCreditBalance: (address: string) => Promise<number>;
  isMetaMaskAvailable: () => boolean;
  markProfileComplete: () => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [contractsInitialized, setContractsInitialized] = useState(false);
  const [contractAddresses, setContractAddresses] = useState<{
    simpleBDAGTransfer: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWeb3Initialized, setIsWeb3Initialized] = useState(false);
  const [contractsChecked, setContractsChecked] = useState(false);

  // Initialize Web3 connection - SIMPLE VERSION
  const connect = async (): Promise<boolean> => {
    try {
      // Prevent duplicate initialization
      if (isWeb3Initialized && isConnected) {
        console.log('Web3Context: Already connected, skipping initialization');
        return true;
      }
      
      // Check if MetaMask is available
      if (!isMetaMaskAvailable()) {
        setError('MetaMask is not installed. Please install MetaMask to use blockchain features.');
        return false;
      }
      
      setIsInitializing(true);
      setError(null);
      
      console.log('Web3Context: Starting Web3 initialization...');
      
      const success = await initializeWeb3(window.ethereum);
      console.log('Web3Context: initializeWeb3 result:', success);
      
      if (success) {
        console.log('Web3Context: Web3 initialized successfully, setting up state...');
        
        setIsWeb3Initialized(true);
        
        // Get account and network directly from the provider/signer that was just created
        try {
          const { getProvider, getSigner } = await import('@/integrations/web3/contracts');
          const provider = getProvider();
          const signer = getSigner();
          
          if (provider && signer) {
            const currentAccount = await signer.getAddress();
            const currentNetwork = await provider.getNetwork();
            
            console.log('Web3Context: Got account and network directly:', { currentAccount, currentNetwork });
            
            setAccount(currentAccount);
            setNetwork(currentNetwork.name);
            setIsConnected(true);
            
            // Save connection state to localStorage
            if (currentAccount) {
              localStorage.setItem('web3_connected', 'true');
              localStorage.setItem('web3_account', currentAccount);
              localStorage.setItem('web3_network', currentNetwork.name);
              console.log('Web3Context: Connection state saved to localStorage');
            }
            
            // Check contract status - only call this once
            console.log('Web3Context: Checking contract status...');
            await checkContractStatus(currentAccount);
            
            // Wait a bit for state to update, then log the actual current state
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('Web3Context: Connection complete, actual state:', {
              isWeb3Initialized: true,
              isConnected: true,
              account: currentAccount,
              network: currentNetwork.name,
              contractsInitialized: contractsInitialized // Use the actual state value
            });
            
            return true;
          } else {
            throw new Error('Provider or signer not available after initialization');
          }
        } catch (error) {
          console.error('Web3Context: Error getting account/network:', error);
          throw error;
        }
      } else {
        setError('Failed to initialize Web3');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Web3Context: Connection error:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Check contract status
  const checkContractStatus = async (currentAccount?: string) => {
    try {
      console.log('Web3Context: Checking contract status...', {
        isWeb3Initialized,
        account: currentAccount || account,
        contractsChecked
      });
      
      // Use the passed account or fall back to state
      const accountToCheck = currentAccount || account;
      
      // Check if we have a provider and signer
      if (!isWeb3Initialized || !accountToCheck) {
        console.log('Web3Context: Web3 not fully initialized or no account, skipping contract check', {
          isWeb3Initialized,
          accountToCheck
        });
        return;
      }
      
      // Only check contracts once
      if (contractsChecked) {
        console.log('Web3Context: Contracts already checked, skipping');
        return;
      }
      
      // Set contractsChecked to true immediately to prevent duplicate calls
      setContractsChecked(true);
      
      // Check if we're on the correct network
      const currentNetwork = getCurrentNetwork();
      console.log('Web3Context: Expected network:', currentNetwork);
      
      // Validate that we're on the correct network
      try {
        const { getProvider } = await import('@/integrations/web3/contracts');
        const provider = getProvider();
        if (provider) {
          const actualNetwork = await provider.getNetwork();
          const expectedChainId = parseInt(currentNetwork.chainId, 16);
          
          console.log('Web3Context: Network validation:', {
            actual: actualNetwork.chainId,
            expected: expectedChainId,
            actualName: actualNetwork.name,
            expectedName: currentNetwork.name
          });
          
          if (actualNetwork.chainId !== expectedChainId) {
            console.error('Web3Context: Wrong network detected');
            setError(`Please switch to ${currentNetwork.name} (Chain ID: ${expectedChainId}) in MetaMask`);
            setContractsInitialized(false);
            setContractsChecked(true);
            return;
          }
        }
      } catch (networkError) {
        console.error('Web3Context: Network validation failed:', networkError);
        setError('Failed to validate network. Please check your MetaMask connection.');
        setContractsInitialized(false);
        setContractsChecked(true);
        return;
      }
      
      // Actually test the contract by calling a view function
      try {
        const { getSimpleBDAGTransferContract } = await import('@/integrations/web3/contracts');
        const contract = getSimpleBDAGTransferContract();
        
        // Test the contract by calling owner function (which we confirmed works)
        console.log('Web3Context: Testing contract with owner call...');
        const owner = await contract.owner();
        console.log('Web3Context: Contract test successful, owner:', owner);
        
        // If we get here, the contract is working
        setContractsInitialized(true);
        setContractAddresses({
          simpleBDAGTransfer: '0x643859f45cC468e26d98917b086a7B50436f51db'
        });
        setContractsChecked(true);
        
        console.log('Web3Context: Contracts verified and marked as initialized');
      } catch (contractError) {
        console.error('Web3Context: Contract test failed:', contractError);
        
        // Contract test failed - set error and don't mark as initialized
        setError('Smart contracts are not responding. Please check your network connection and try again.');
        setContractsInitialized(false);
        setContractsChecked(true);
        
        // Clear any cached contract addresses
        setContractAddresses(null);
      }
    } catch (error) {
      console.error('Web3Context: Error checking contract status:', error);
      setError('Failed to verify smart contracts. Please try again.');
      setContractsInitialized(false);
      setContractsChecked(true);
    }
    
    console.log('Web3Context: === CHECK CONTRACT STATUS END ===');
  };

  // Disconnect from Web3
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setNetwork(null);
    setContractsInitialized(false);
    setContractAddresses(null);
    setIsWeb3Initialized(false);
    setContractsChecked(false);
    
    // Clear localStorage
    localStorage.removeItem('web3_connected');
    localStorage.removeItem('web3_account');
    localStorage.removeItem('web3_network');
    
    console.log('Web3Context: Disconnected and cleared state');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Get credit balance (simplified - returns 0 for now)
  const getCreditBalance = async (address: string): Promise<number> => {
    try {
      // For now, return 0 since we're not using credits anymore
      // This function exists for compatibility with existing code
      return 0;
    } catch (error) {
      console.error('Error getting credit balance:', error);
      return 0;
    }
  };

  // Mark profile setup as complete
  const markProfileComplete = () => {
    localStorage.setItem('userProfileComplete', 'true');
    console.log('Web3Context: Profile setup marked as complete.');
  };

  // Switch network
  const switchNetwork = async (networkName: 'mainnet' | 'testnet'): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        setError('MetaMask is not available');
        return false;
      }

      const targetNetwork = networkName === 'testnet' ? 
        { chainId: '0x413', name: 'Primordial BlockDAG Testnet' } : 
        { chainId: '0x1', name: 'Ethereum Mainnet' };

      try {
        // Try to switch to the target network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetNetwork.chainId }],
        });
        
        console.log(`Switched to ${targetNetwork.name}`);
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: targetNetwork.chainId,
                  chainName: targetNetwork.name,
                  rpcUrls: networkName === 'testnet' ? 
                    ['https://rpc.primordial.bdagscan.com'] : 
                    ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
                  blockExplorerUrls: networkName === 'testnet' ? 
                    ['https://primordial.bdagscan.com'] : 
                    ['https://etherscan.io'],
                  nativeCurrency: {
                    name: networkName === 'testnet' ? 'BDAG' : 'ETH',
                    symbol: networkName === 'testnet' ? 'BDAG' : 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
            return true;
          } catch (addError) {
            console.error('Error adding network:', addError);
            setError('Failed to add network to MetaMask');
            return false;
          }
        } else {
          console.error('Error switching network:', switchError);
          setError('Failed to switch network');
          return false;
        }
      }
    } catch (error) {
      console.error('Network switching error:', error);
      setError('Failed to switch network');
      return false;
    }
  };

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('Web3Context: State changed:', {
      isConnected,
      isWeb3Initialized,
      account,
      network,
      contractsInitialized,
      isInitializing
    });
  }, [isConnected, isWeb3Initialized, account, network, contractsInitialized, isInitializing]);

  // Debug: Monitor contractsInitialized specifically
  useEffect(() => {
    console.log('Web3Context: contractsInitialized changed to:', contractsInitialized);
  }, [contractsInitialized]);

  // Trigger contract check when Web3 is initialized
  useEffect(() => {
    if (isWeb3Initialized && account && !contractsInitialized && !contractsChecked) {
      console.log('Web3Context: Web3 initialized, triggering contract check...');
      checkContractStatus(account);
    }
  }, [isWeb3Initialized, account, contractsInitialized, contractsChecked]);

  // Context value
  const contextValue: Web3ContextType = {
    isConnected,
    isInitializing,
    isWeb3Initialized,
    account,
    network,
    contractsInitialized,
    contractAddresses,
    connect,
    disconnect,
    switchNetwork,
    getCreditBalance,
    isMetaMaskAvailable: () => isMetaMaskAvailable(),
    markProfileComplete,
    error,
    clearError,
  };

  // Listen for MetaMask account changes
  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Web3Context: MetaMask accounts changed:', accounts);
      
      if (accounts.length === 0) {
        // MetaMask disconnected
        console.log('Web3Context: MetaMask disconnected');
        disconnect();
      } else if (accounts[0] !== account) {
        // Account changed
        console.log('Web3Context: MetaMask account changed from', account, 'to', accounts[0]);
        setAccount(accounts[0]);
        
        // Update localStorage
        if (accounts[0]) {
          localStorage.setItem('web3_account', accounts[0]);
        }
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('Web3Context: MetaMask chain changed to:', chainId);
      // You might want to handle network switching here
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account]);

  // Auto-connect on mount if previously connected - SIMPLE VERSION
  useEffect(() => {
    const autoConnect = async () => {
      // Don't auto-connect if we're already connected or contracts are already initialized
      if (isConnected || isWeb3Initialized || contractsInitialized) {
        console.log('Web3Context: Already connected or contracts initialized, skipping auto-connect');
        return;
      }
      
      
      console.log('Web3Context: Attempting auto-connect...');
      
      if (typeof window.ethereum !== 'undefined') {
        try {
          console.log('Web3Context: Starting auto-connect process...');
          
          // Check if we were previously connected
          const wasConnected = localStorage.getItem('web3_connected') === 'true';
          const savedAccount = localStorage.getItem('web3_account');
          const savedNetwork = localStorage.getItem('web3_network');
          
          console.log('Web3Context: Saved state:', { wasConnected, savedAccount, savedNetwork });
          
          if (wasConnected && savedAccount) {
            console.log('Web3Context: Attempting auto-connect with saved account:', savedAccount);
            
            // Check if MetaMask is still connected to the same account
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            console.log('Web3Context: Current MetaMask state:', { accounts, currentChainId });
            
            if (accounts.length > 0 && accounts[0] === savedAccount) {
              console.log('Web3Context: MetaMask still connected, restoring state');
              
              // Restore the connection state
              setAccount(savedAccount);
              setNetwork(savedNetwork || 'Unknown');
              setIsConnected(true);
              
              // Try to initialize contracts
              try {
                console.log('Web3Context: Initializing contracts...');
                await initializeWeb3(window.ethereum);
                setIsWeb3Initialized(true);
                // Don't call checkContractStatus here - it's already called in the main connect flow
                console.log('Web3Context: Contracts initialized successfully');
              } catch (err) {
                console.log('Web3Context: Contract initialization failed during auto-connect:', err);
                // Don't fail auto-connect if contracts fail
              }
            } else {
              console.log('Web3Context: MetaMask account changed or disconnected, clearing saved state');
              localStorage.removeItem('web3_connected');
              localStorage.removeItem('web3_account');
              localStorage.removeItem('web3_network');
            }
          } else {
            console.log('Web3Context: No saved connection state, checking if MetaMask is already connected...');
            
            // Check if MetaMask is already connected but we don't have saved state
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
              console.log('Web3Context: MetaMask already connected, checking network...');
              
              // Check if we're on the correct network before attempting to initialize
              try {
                const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
                const expectedChainId = parseInt(getCurrentNetwork().chainId, 16);
                
                if (parseInt(currentChainId, 16) === expectedChainId) {
                  console.log('Web3Context: MetaMask on correct network, attempting to initialize...');
                  
                  try {
                    const success = await initializeWeb3(window.ethereum);
                    if (success) {
                      setIsWeb3Initialized(true);
                      const currentAccount = await getCurrentAccount();
                      const currentNetwork = getCurrentNetwork();
                      
                      setAccount(currentAccount);
                      setNetwork(currentNetwork.name);
                      setIsConnected(true);
                      
                      // Save the connection state
                      if (currentAccount) {
                        localStorage.setItem('web3_connected', 'true');
                        localStorage.setItem('web3_account', currentAccount);
                        localStorage.setItem('web3_network', currentNetwork.name);
                        console.log('Web3Context: Auto-detected connection saved to localStorage');
                      }
                      
                                             await checkContractStatus(currentAccount);
                    }
                  } catch (err) {
                    console.log('Web3Context: Failed to initialize existing MetaMask connection:', err);
                  }
                } else {
                  console.log('Web3Context: MetaMask connected but on wrong network, not auto-connecting');
                  console.log(`Current: ${parseInt(currentChainId, 16)}, Expected: ${expectedChainId}`);
                  // Don't auto-connect when on wrong network - let user manually connect
                }
              } catch (err) {
                console.log('Web3Context: Failed to check network during auto-connect:', err);
              }
            }
          }
        } catch (err) {
          console.log('Web3Context: Auto-connect failed:', err);
          // Clear any corrupted saved state
          localStorage.removeItem('web3_connected');
          localStorage.removeItem('web3_account');
          localStorage.removeItem('web3_network');
        }
      }
    };

    // Delay auto-connect to ensure page is loaded
    const timeoutId = setTimeout(autoConnect, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [isConnected, isWeb3Initialized, contractsInitialized, contractsChecked]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};
