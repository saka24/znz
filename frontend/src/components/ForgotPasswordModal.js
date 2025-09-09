import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('email'); // 'email', 'sent', 'reset'
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      console.log('Forgot password response:', response.data);
      setStep('sent');
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetToken.trim()) {
      toast.error('Please enter the reset token from your email');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token: resetToken,
        new_password: newPassword
      });
      
      toast.success('Password reset successfully! You can now log in.');
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setIsLoading(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {step === 'reset' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('sent')}
                className="p-1 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span>
              {step === 'email' && 'Forgot Password'}
              {step === 'sent' && 'Check Your Email'}
              {step === 'reset' && 'Reset Password'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Email Sent Confirmation */}
        {step === 'sent' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email Sent!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a password reset email to:
              </p>
              <p className="text-sm font-medium text-gray-900 mb-4">
                {email}
              </p>
            </div>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Next Steps:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Check your email inbox</li>
                      <li>• Look for an email from SISI Chat</li>
                      <li>• Copy the reset token from the email</li>
                      <li>• Click "I have the token" below</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => setStep('reset')}
              >
                I have the token
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendResetEmail}
                disabled={isLoading}
              >
                Resend Email
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Enter the reset token from your email and your new password.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Token
                </label>
                <Input
                  type="text"
                  placeholder="Enter token from email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Resetting...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;