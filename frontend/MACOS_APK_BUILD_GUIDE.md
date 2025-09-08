# 🍎 SISI Chat APK Build Guide for macOS

## 📋 Prerequisites for Mac

1. **Download Android Studio** (if not installed):
   - Go to https://developer.android.com/studio
   - Click "Download Android Studio"
   - Download the `.dmg` file for Mac
   - Double-click the `.dmg` and drag Android Studio to Applications

2. **Download your project files**:
   ```bash
   # Open Terminal (⌘ + Space, type "Terminal")
   scp -r user@server:/app/frontend ~/Desktop/sisi-chat-project
   cd ~/Desktop/sisi-chat-project
   ```

## 🚀 Step 1: Open Android Folder in Android Studio

### 1.1 Launch Android Studio
- **Method 1**: Press `⌘ + Space`, type "Android Studio", press Enter
- **Method 2**: Go to Applications folder, double-click Android Studio
- **Method 3**: Click Android Studio in Dock (if pinned)

### 1.2 Open the Android Project
1. **When Android Studio opens**, you'll see the welcome screen
2. Click **"Open an existing project"** 
   - If you have a recent project open, go to **File** → **Open** instead

3. **Navigate to your project**:
   - In the file picker, navigate to: `Desktop/sisi-chat-project/android`
   - **Important**: Select the `android` folder (not the parent folder)
   - Click **"Open"**

### 1.3 Wait for Project Setup
- Android Studio will show "Gradle sync in progress..."
- **First time**: This can take 5-15 minutes (downloading dependencies)
- **Progress bar** will show at the bottom
- ☕ **Grab a coffee** - this is normal!

### 1.4 Verify Project Loaded
You should see:
- **Project structure** in left panel showing `app`, `gradle`, etc.
- **No red errors** in the bottom panel
- **"Gradle sync successful"** message

## 🔨 Step 2: Generate Signed Bundle/APK

### 2.1 Access the Build Menu
1. **Click "Build"** in the top menu bar
   - It's between "Code" and "Run" in the menu
2. **Click "Generate Signed Bundle/APK..."**
   - It's near the bottom of the Build menu

### 2.2 Choose APK Option
1. A dialog will open: **"Generate Signed Bundle or APK"**
2. **Select "APK"** (not "Android App Bundle")
3. Click **"Next"**

## 🔐 Step 3: Create Keystore (First Time Only)

### 3.1 Create New Keystore
1. In the APK generation dialog, click **"Create new..."**
2. **Keystore creation dialog** will open

### 3.2 Fill Keystore Details
**Key store path**:
- Click the folder icon 📁
- Navigate to a safe location: `Desktop/sisi-chat-keystore/`
- Create new folder: Click **"New Folder"**, name it `sisi-chat-keystore`
- Filename: `sisi-chat-release-key.jks`
- Full path example: `/Users/yourname/Desktop/sisi-chat-keystore/sisi-chat-release-key.jks`

**Passwords**:
- **Password**: `SisiChat2024!` (or create your own secure password)
- **Confirm**: `SisiChat2024!` (same password)

**Key**:
- **Alias**: `sisi-chat-key`
- **Password**: `SisiChat2024!` (same as keystore password)
- **Confirm**: `SisiChat2024!`
- **Validity (years)**: `25`

**Certificate**:
- **First and Last Name**: Your full name
- **Organizational Unit**: `Development` (or leave blank)
- **Organization**: Your company name (or your name)
- **City or Locality**: Your city
- **State or Province**: Your state/province
- **Country Code (XX)**: Your country code (US, TZ, UK, etc.)

### 3.3 Save Keystore
1. Click **"OK"** to create the keystore
2. **⚠️ IMPORTANT**: Write down your keystore password and location!
   ```
   Keystore Location: /Users/yourname/Desktop/sisi-chat-keystore/sisi-chat-release-key.jks
   Password: SisiChat2024!
   Alias: sisi-chat-key
   ```

## 🏗️ Step 4: Generate APK

### 4.1 Build Configuration
1. **Key store path**: Should show your keystore file path
2. **Key store password**: Enter your password
3. **Key alias**: Should show `sisi-chat-key`
4. **Key password**: Enter your password
5. **Remember passwords**: ✅ Check this box (for convenience)

### 4.2 Choose Build Type
1. **Destination Folder**: Shows where APK will be saved
   - Default: `android/app/release/`
   - You can change this if needed
2. **Build Variants**: Select **"release"**
3. Click **"Next"**

### 4.3 Final Build Settings
1. **Signature Versions**:
   - ✅ **V1 (Jar Signature)**: Check this
   - ✅ **V2 (Full APK Signature)**: Check this
2. Click **"Finish"**

### 4.4 Wait for Build
- **Build process** will start (progress bar at bottom)
- Takes 2-5 minutes typically
- **Success message** will appear when done

## 📱 Step 5: Find Your APK

### 5.1 Locate APK File
1. **Success notification** will show with "locate" link
2. **Or manually navigate**:
   ```
   ~/Desktop/sisi-chat-project/android/app/release/app-release.apk
   ```

### 5.2 Verify APK
- **File size**: Should be 15-50 MB
- **Name**: `app-release.apk`
- **Date**: Today's date

## 🧪 Step 6: Test Your APK

### 6.1 Install on Android Device
**Method 1 - ADB (if device connected)**:
```bash
# Install ADB if needed
brew install android-platform-tools

# Install APK
adb install ~/Desktop/sisi-chat-project/android/app/release/app-release.apk
```

**Method 2 - Manual Install**:
1. Copy APK to your Android phone
2. Open file manager on phone
3. Tap the APK file
4. Allow "Install from unknown sources" if prompted
5. Tap "Install"

### 6.2 Test App Functions
- ✅ App launches and shows SISI Chat branding
- ✅ Registration/login works
- ✅ Orange theme is applied correctly
- ✅ Navigation between tabs works
- ✅ AI features respond (if backend is running)

## 🚨 Common macOS Issues & Solutions

### Issue 1: "Command line tools not found"
**Solution**:
```bash
xcode-select --install
```

### Issue 2: Gradle sync fails
**Solution**:
1. **File** → **Invalidate Caches and Restart**
2. Choose "Invalidate and Restart"

### Issue 3: Keystore creation fails
**Solution**:
- Make sure you have write permissions to the chosen directory
- Try saving to Desktop instead of Documents

### Issue 4: Build fails with "No Android SDK"
**Solution**:
1. **Android Studio** → **Preferences** (⌘ + ,)
2. **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Make sure SDK is installed and path is correct

### Issue 5: APK install fails on device
**Solution**:
- Enable "Developer Options" on Android device
- Enable "USB Debugging"
- Allow "Install from unknown sources"

## 📝 Mac-Specific Tips

### Keyboard Shortcuts:
- **⌘ + ,**: Open Preferences
- **⌘ + Shift + A**: Find Action
- **⌘ + B**: Build Project
- **⌘ + R**: Run App

### File Locations:
- **Android Studio**: `/Applications/Android Studio.app`
- **Android SDK**: `~/Library/Android/sdk/`
- **Gradle**: `~/.gradle/`

### Terminal Commands:
```bash
# Check if Android SDK is installed
ls ~/Library/Android/sdk

# Check ADB is working
adb devices

# Install APK via command line
adb install path/to/your/app-release.apk
```

## ✅ Success Checklist

- [ ] Android Studio downloaded and installed
- [ ] Project opened in Android Studio successfully
- [ ] Gradle sync completed without errors
- [ ] Keystore created and password saved
- [ ] APK generated successfully
- [ ] APK file found and verified
- [ ] APK installed and tested on device
- [ ] All app features working correctly

## 🎉 Next Steps

Once your APK is working:
1. **Upload to Google Play Console**
2. **Complete store listing** with provided assets
3. **Submit for review**
4. **Launch your app!** 🚀

Your **SISI Chat** app is ready to compete with major messaging apps! 🧡

---

**Need help?** Check the error messages carefully and Google them - Android Studio errors are well-documented with Mac-specific solutions.