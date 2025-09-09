import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable && !isInstalled) {
      // Show banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  if (!showBanner || isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="bg-orange-50 border-orange-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-900">
                Install SISI Chat
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Add to your home screen for quick access and offline features
              </p>
              
              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  onClick={installApp}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBanner(false)}
                  className="text-orange-600 hover:text-orange-700 text-xs px-2 py-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Later
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallBanner;