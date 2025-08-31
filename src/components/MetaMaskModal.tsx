import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Download, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface MetaMaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (account: string) => void;
}

export const MetaMaskModal = ({ isOpen, onOpenChange, onSuccess }: MetaMaskModalProps) => {
  const { 
    isConnected, 
    account, 
    connect, 
    isInitializing, 
    error: walletError,
    isMetaMaskAvailable,
    switchNetwork
  } = useWeb3();
  const { toast } = useToast();
  const [step, setStep] = useState<'connect' | 'success' | 'error' | 'network'>('connect');
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const handleConnect = async () => {
    try {
      const success = await connect();
      if (success) {
        setStep('success');
        toast({
          title: "Wallet Connected Successfully! 🎉",
          description: `Your MetaMask wallet is now connected and ready for payments.`,
        });
        // Call onSuccess callback after a short delay to show success state
        setTimeout(() => {
          if (onSuccess && account) {
            onSuccess(account);
          }
          onOpenChange(false);
        }, 2000);
      } else {
        setStep('error');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setStep('error');
    }
  };

  const handleSwitchToTestnet = async () => {
    setIsSwitchingNetwork(true);
    try {
      const success = await switchNetwork('testnet');
      if (success) {
        toast({
          title: "Network Switched! 🔄",
          description: "Successfully switched to Primordial BlockDAG Testnet. Please try connecting again.",
        });
        setStep('connect');
      } else {
        toast({
          title: "Network Switch Failed ❌",
          description: "Failed to switch network. Please manually switch to Primordial BlockDAG Testnet in MetaMask.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast({
        title: "Network Switch Failed ❌",
        description: "An error occurred while switching networks.",
        variant: "destructive",
      });
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-8 w-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your MetaMask Wallet</h3>
        <p className="text-gray-600">
          To publish stories and earn from readers, you need to connect your MetaMask wallet.
        </p>
      </div>

      {!isMetaMaskAvailable() ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">MetaMask Not Installed</span>
            </div>
            <p className="text-sm text-amber-700 mt-2">
              You need to install the MetaMask browser extension to connect your wallet.
            </p>
          </div>
          
          <Button 
            onClick={handleInstallMetaMask}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Install MetaMask
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">MetaMask Ready</span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              MetaMask is installed. Click the button below to connect your wallet.
            </p>
          </div>
          
          <Button 
            onClick={handleConnect}
            disabled={isInitializing}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {isInitializing ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        </div>
      )}

      {walletError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Connection Error</span>
          </div>
          <p className="text-sm text-red-700 mt-2">{walletError}</p>
          
          {/* Show network switch option if it's a network-related error */}
          {walletError.includes('network') || walletError.includes('Chain ID') ? (
            <div className="mt-3">
              <Button 
                onClick={handleSwitchToTestnet}
                disabled={isSwitchingNetwork}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isSwitchingNetwork ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Switching Network...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Switch to Primordial BlockDAG Testnet
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Wallet Connected Successfully!</h3>
      <p className="text-gray-600">
        Your MetaMask wallet is now connected and ready for author registration.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-green-800 font-mono">
          {account?.slice(0, 6)}...{account?.slice(-4)}
        </p>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Connection Failed</h3>
      <p className="text-gray-600">
        There was an error connecting your MetaMask wallet. Please try again.
      </p>
      <Button 
        onClick={() => setStep('connect')}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
      >
        Try Again
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect MetaMask Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to enable author features and earn from your stories.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {step === 'connect' && renderConnectStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
