import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { QrCode, Camera, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const QRCodeComponent = ({ currentUser, onAddFriend }) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Generate QR code for current user
  useEffect(() => {
    if (currentUser) {
      const generateQRCode = async () => {
        try {
          // Create deep link URL that opens directly in SISI Chat
          const baseUrl = window.location.origin;
          const deepLinkUrl = `${baseUrl}/add-friend?user=${encodeURIComponent(currentUser.username)}&id=${encodeURIComponent(currentUser.id)}&name=${encodeURIComponent(currentUser.display_name)}`;
          
          const dataURL = await QRCode.toDataURL(deepLinkUrl, {
            width: 256,
            margin: 2,
            color: {
              dark: '#f97316', // Orange color
              light: '#ffffff'
            }
          });
          
          setQrCodeDataURL(dataURL);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          toast.error('Failed to generate QR code');
        }
      };

      generateQRCode();
    }
  }, [currentUser]);

  const copyToClipboard = async () => {
    try {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/add-friend?user=${encodeURIComponent(currentUser?.username)}&id=${encodeURIComponent(currentUser?.id)}&name=${encodeURIComponent(currentUser?.display_name)}`;
      const shareText = `Add me on SISI Chat! ${shareUrl}`;
      
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareProfile = async () => {
    try {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/add-friend?user=${encodeURIComponent(currentUser?.username)}&id=${encodeURIComponent(currentUser?.id)}&name=${encodeURIComponent(currentUser?.display_name)}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Add me on SISI Chat!',
          text: `Connect with me on SISI Chat`,
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback to copy
        await navigator.clipboard.writeText(`Add me on SISI Chat! ${shareUrl}`);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share profile');
    }
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => handleScanResult(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment' // Use back camera if available
          }
        );
        
        await qrScannerRef.current.start();
      }
    } catch (error) {
      console.error('Failed to start scanner:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (data) => {
    try {
      stopScanning();
      
      // Check if it's a SISI Chat deep link URL
      if (data.includes('/add-friend?')) {
        const url = new URL(data);
        const username = url.searchParams.get('user');
        const userId = url.searchParams.get('id');
        const displayName = url.searchParams.get('name');
        
        if (userId === currentUser?.id) {
          toast.info("That's your own QR code!");
          return;
        }
        
        if (username && userId && displayName) {
          // Add friend via QR code
          const success = await onAddFriend({
            id: userId,
            username: username,
            display_name: displayName
          });
          
          if (success) {
            toast.success(`Added ${displayName} as friend!`);
          }
        } else {
          toast.error('Invalid QR code data');
        }
      } else {
        // Try legacy JSON format for backward compatibility
        try {
          const scannedData = JSON.parse(data);
          if (scannedData.type === 'sisi_chat_user') {
            if (scannedData.id === currentUser?.id) {
              toast.info("That's your own QR code!");
              return;
            }
            
            const success = await onAddFriend({
              id: scannedData.id,
              username: scannedData.username,
              display_name: scannedData.display_name
            });
            
            if (success) {
              toast.success(`Added ${scannedData.display_name} as friend!`);
            }
          } else {
            toast.error('Invalid SISI Chat QR code');
          }
        } catch (jsonError) {
          toast.error('Invalid QR code format');
        }
      }
    } catch (error) {
      console.error('Failed to process QR code:', error);
      toast.error('Failed to process QR code');
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      {!isScanning ? (
        // QR Code Display
        <div className="text-center">
          {qrCodeDataURL ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <img 
                    src={qrCodeDataURL} 
                    alt="Your QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Your QR Code</p>
                <p className="text-xs text-gray-600">
                  Let others scan this code to add you as a friend
                </p>
              </div>
              
              <div className="flex space-x-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{isCopied ? 'Copied!' : 'Copy Username'}</span>
                </Button>
                
                <Button
                  size="sm"
                  onClick={startScanning}
                  className="bg-orange-600 hover:bg-orange-700 flex items-center space-x-1"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan QR Code</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-sm text-gray-600">Generating QR code...</span>
            </div>
          )}
        </div>
      ) : (
        // QR Code Scanner
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Scan QR Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Point your camera at a SISI Chat QR code
            </p>
          </div>
          
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full max-w-sm mx-auto rounded-lg bg-black"
              style={{ aspectRatio: '1/1' }}
            />
            
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border-2 border-orange-500 rounded-lg opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 border-2 border-orange-500 rounded-lg"></div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={stopScanning}
              className="flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Cancel Scanning</span>
            </Button>
          </div>
        </div>
      )}
      
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-orange-900">Quick Add</span>
          </div>
          <p className="text-xs text-orange-700">
            Share your username: <code className="bg-orange-100 px-1 rounded">@{currentUser?.username || 'username'}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeComponent;