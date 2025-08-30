import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { 
  initializeWeb3, 
  getCurrentAccount, 
  switchNetwork,
  getCreditBalance,
  getContractStatus,
  getContractAddresses,
  addAndSwitchToPrimordialTestnet
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
    integration: string;
    credits: string;
    payment: string;
    story: string;
  } | null;
  
  // Functions
  connect: () => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: (networkName: 'mainnet' | 'testnet') => Promise<boolean>;
  addAndSwitchToPrimordialTestnet: () => Promise<boolean>;
  getCreditBalance: (address: string) => Promise<number>;
  
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
    integration: string;
    credits: string;
    payment: string;
    story: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWeb3Initialized, setIsWeb3Initialized] = useState(false);

  // Initialize Web3 connection
  const connect = async (): Promise<boolean> => {
    try {
      // Prevent duplicate initialization
      if (isWeb3Initialized && isConnected) {
        console.log('Web3Context: Already connected, skipping initialization');
        return true;
      }
      
      setIsInitializing(true);
      setError(null);
      
      const success = await initializeWeb3();
      if (success) {
        setIsWeb3Initialized(true);
        const currentAccount = await getCurrentAccount();
        const currentNetwork = getCurrentNetwork();
        
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
        
        // Check contract status
        await checkContractStatus();
        
        return true;
      } else {
        setError('Failed to initialize Web3');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Disconnect Web3
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setNetwork(null);
    setContractsInitialized(false);
    setContractAddresses(null);
    setError(null);
    setIsWeb3Initialized(false);
    
    // Clear connection state from localStorage
    localStorage.removeItem('web3_connected');
    localStorage.removeItem('web3_account');
    localStorage.removeItem('web3_network');
    console.log('Web3Context: Connection state cleared from localStorage');
  };

  // Check contract initialization status
  const checkContractStatus = async () => {
    try {
      const status = await getContractStatus();
      setContractsInitialized(status.initialized);
      
      if (status.initialized) {
        const addresses = await getContractAddresses();
        setContractAddresses(addresses);
      }
    } catch (err) {
      console.error('Failed to check contract status:', err);
      setContractsInitialized(false);
    }
  };

  // Handle account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // MetaMask is locked or user has no accounts
          disconnect();
        } else if (accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        // Reload the page when chain changes
        window.location.reload();
      };

      const handleDisconnect = () => {
        disconnect();
      };

      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [account]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const autoConnect = async () => {
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
                await initializeWeb3();
                setIsWeb3Initialized(true);
                await checkContractStatus();
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
                    const success = await initializeWeb3();
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
                      
                      await checkContractStatus();
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

    autoConnect();
  }, []);

  // Clear error
  const clearError = () => setError(null);

  const value: Web3ContextType = {
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
    addAndSwitchToPrimordialTestnet,
    getCreditBalance,
    error,
    clearError,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
