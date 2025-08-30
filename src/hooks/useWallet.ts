import { useState, useEffect } from 'react';

interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Get the current account
  const getCurrentAccount = async () => {
    if (!isMetaMaskInstalled()) return null;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  };

  // Get account balance
  const getAccountBalance = async (account: string) => {
    if (!isMetaMaskInstalled()) return null;
    
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      });
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  };

  // Get chain ID
  const getChainId = async () => {
    if (!isMetaMaskInstalled()) return null;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId;
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      return false;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const account = accounts[0];
      const chainId = await getChainId();
      const balance = await getAccountBalance(account);

      setWalletState({
        isConnected: true,
        account,
        chainId,
        balance,
        isConnecting: false,
        error: null,
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return true;
    } catch (error: any) {
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
      return false;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    if (isMetaMaskInstalled()) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }

    setWalletState({
      isConnected: false,
      account: null,
      chainId: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // MetaMask is locked or user has no accounts
      disconnectWallet();
    } else if (accounts[0] !== walletState.account) {
      // Account changed
      const account = accounts[0];
      const balance = await getAccountBalance(account);
      
      setWalletState(prev => ({
        ...prev,
        account,
        balance,
      }));
    }
  };

  // Handle chain changes
  const handleChainChanged = async (chainId: string) => {
    setWalletState(prev => ({
      ...prev,
      chainId,
    }));
  };

  // Initialize wallet state on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (isMetaMaskInstalled()) {
        const account = await getCurrentAccount();
        if (account) {
          const chainId = await getChainId();
          const balance = await getAccountBalance(account);
          
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            account,
            chainId,
            balance,
          }));

          // Set up listeners
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
        }
      }
    };

    initializeWallet();

    return () => {
      if (isMetaMaskInstalled()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled,
  };
};
