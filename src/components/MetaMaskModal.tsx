import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Download, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface MetaMaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account: string) => void;
}

export const MetaMaskModal = ({ isOpen, onOpenChange, onSuccess }: MetaMaskModalProps) => {
  const { 
    isConnected, 
    account, 
    connectWallet, 
    isConnecting, 
    error: walletError,
    isMetaMaskInstalled 
  } = useWallet();
  const { toast } = useToast();
  const [step, setStep] = useState<'connect' | 'success' | 'error'>('connect');

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      setStep('success');
      toast({
        title: "Wallet Connected!",
        description: `Successfully connected to ${account?.slice(0, 6)}...${account?.slice(-4)}`,
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
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold">Connect Your MetaMask Wallet</h3>
        <p className="text-muted-foreground">
          To publish stories and receive payments, you need to connect your MetaMask wallet
        </p>
      </div>

      {!isMetaMaskInstalled() ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800">MetaMask Not Installed</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You need to install MetaMask browser extension to continue as an author.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleInstallMetaMask}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Install MetaMask
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              After installation, refresh this page and try again
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800">Why Connect MetaMask?</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Receive direct payments from readers</li>
                  <li>• No middlemen or platform fees</li>
                  <li>• Transparent blockchain transactions</li>
                  <li>• Future smart contract integration</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Click to open MetaMask and approve the connection</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-green-800">Wallet Connected Successfully!</h3>
        <p className="text-muted-foreground">
          Your MetaMask wallet is now connected and ready for payments
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">Connected Address:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </Badge>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Redirecting you back to complete your registration...</p>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-red-800">Connection Failed</h3>
        <p className="text-muted-foreground">
          {walletError || 'Failed to connect to MetaMask. Please try again.'}
        </p>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={() => setStep('connect')}
          variant="outline"
          className="w-full"
        >
          Try Again
        </Button>
        
        <Button 
          onClick={() => onOpenChange(false)}
          variant="ghost"
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>MetaMask Connection</span>
          </DialogTitle>
          <DialogDescription>
            Connect your wallet to start earning from your stories
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
