import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { 
  Settings, 
  User, 
  Shield, 
  Eye, 
  Camera, 
  Lock, 
  Mail, 
  Phone, 
  Globe, 
  Clock,
  LogOut,
  Edit,
  Save,
  X,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountSettings = ({ user, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState({});
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [privacySettings, setPrivacySettings] = useState({
    last_seen_online: true,
    profile_photo_visible: true,
    phone_visible: false,
    email_visible: false,
    search_by_phone: true,
    search_by_email: true,
    read_receipts: true,
    typing_indicators: true
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Load user settings
  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      });
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/privacy-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrivacySettings(response.data);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const updatePersonalInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onUpdateUser(response.data.user);
      setIsEditing({});
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowChangePassword(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const updatePrivacySettings = async (setting, value) => {
    try {
      const token = localStorage.getItem('token');
      const updatedSettings = { ...privacySettings, [setting]: value };
      
      await axios.put(`${API}/users/privacy-settings`, updatedSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPrivacySettings(updatedSettings);
      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Failed to update privacy settings');
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/users/profile-picture`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onUpdateUser({ ...user, avatar_url: response.data.avatar_url });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast.error('Failed to upload profile picture');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      uploadProfilePicture(file);
    }
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Account deleted successfully');
      onLogout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your account, privacy, and security settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Camera className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <div className="flex items-center space-x-2">
                  {isEditing.display_name ? (
                    <>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          updatePersonalInfo();
                          setIsEditing({...isEditing, display_name: false});
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({...formData, display_name: user.display_name});
                          setIsEditing({...isEditing, display_name: false});
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 py-2">{user?.display_name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing({...isEditing, display_name: true})}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="flex-1">{user?.email}</span>
                  <Badge variant="secondary">Verified</Badge>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center space-x-2">
                  {isEditing.phone ? (
                    <>
                      <Phone className="h-4 w-4 text-gray-400" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+1234567890"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          updatePersonalInfo();
                          setIsEditing({...isEditing, phone: false});
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({...formData, phone: user.phone || ''});
                          setIsEditing({...isEditing, phone: false});
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="flex-1">{user?.phone || 'Not set'}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing({...isEditing, phone: true})}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing.bio ? (
                  <div className="space-y-2">
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updatePersonalInfo();
                          setIsEditing({...isEditing, bio: false});
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({...formData, bio: user.bio || ''});
                          setIsEditing({...isEditing, bio: false});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-gray-600 flex-1">
                      {user?.bio || 'No bio added yet'}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing({...isEditing, bio: true})}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="flex items-center space-x-2">
                  {isEditing.location ? (
                    <>
                      <Globe className="h-4 w-4 text-gray-400" />
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="City, Country"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          updatePersonalInfo();
                          setIsEditing({...isEditing, location: false});
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({...formData, location: user.location || ''});
                          setIsEditing({...isEditing, location: false});
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="flex-1">{user?.location || 'Not set'}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing({...isEditing, location: true})}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Password */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-gray-500">Change your account password</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change Password
                </Button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Enable 2FA
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                </Button>
              </div>

              {/* Active Sessions */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-gray-500">Manage your active login sessions</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  View Sessions
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                </Button>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700">Delete Account</p>
                    <p className="text-xs text-red-600">Permanently delete your account and all data</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>

              {/* Sign Out */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-gray-500">Sign out of your account</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={onLogout}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Privacy Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Last Seen Online */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Last Seen Online</p>
                    <p className="text-sm text-gray-500">Allow others to see when you were last online</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.last_seen_online}
                  onCheckedChange={(checked) => updatePrivacySettings('last_seen_online', checked)}
                />
              </div>

              {/* Profile Photo Visibility */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Camera className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Profile Photo</p>
                    <p className="text-sm text-gray-500">Who can see your profile photo</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.profile_photo_visible}
                  onCheckedChange={(checked) => updatePrivacySettings('profile_photo_visible', checked)}
                />
              </div>

              {/* Phone Number Visibility */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-sm text-gray-500">Who can see your phone number</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.phone_visible}
                  onCheckedChange={(checked) => updatePrivacySettings('phone_visible', checked)}
                />
              </div>

              {/* Email Visibility */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Email Address</p>
                    <p className="text-sm text-gray-500">Who can see your email address</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.email_visible}
                  onCheckedChange={(checked) => updatePrivacySettings('email_visible', checked)}
                />
              </div>

              {/* Search by Phone */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Search by Phone Number</p>
                    <p className="text-sm text-gray-500">Allow others to find you by phone number</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.search_by_phone}
                  onCheckedChange={(checked) => updatePrivacySettings('search_by_phone', checked)}
                />
              </div>

              {/* Read Receipts */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Read Receipts</p>
                    <p className="text-sm text-gray-500">Let others know when you've read their messages</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.read_receipts}
                  onCheckedChange={(checked) => updatePrivacySettings('read_receipts', checked)}
                />
              </div>

              {/* Typing Indicators */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Edit className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Typing Indicators</p>
                    <p className="text-sm text-gray-500">Show when you're typing a message</p>
                  </div>
                </div>
                <Switch
                  checked={privacySettings.typing_indicators}
                  onCheckedChange={(checked) => updatePrivacySettings('typing_indicators', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Profile Picture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Profile Picture */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">
                    {user?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="font-semibold">{user?.display_name}</h3>
                  <p className="text-sm text-gray-500">
                    Your profile picture is visible to other users based on your privacy settings.
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('profile-picture-upload').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Photo
                    </Button>
                    <Button variant="outline" disabled>
                      Remove Photo
                    </Button>
                  </div>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <Separator />

              {/* Photo Guidelines */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use a clear, high-quality image</li>
                  <li>• Face should be clearly visible</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Supported formats: JPG, PNG, GIF</li>
                  <li>• Recommended size: 400x400 pixels</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <Input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowChangePassword(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={changePassword}
              >
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Delete Account</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All your data including:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4">
                <li>• Messages and conversations</li>
                <li>• Friends and contacts</li>
                <li>• Profile information</li>
                <li>• Purchase history</li>
              </ul>
              <p className="text-sm text-red-800 mt-2">
                will be permanently deleted.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteAccount(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={deleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountSettings;