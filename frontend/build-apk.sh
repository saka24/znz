#!/bin/bash

# SISI Chat APK Build Script
# This script helps you build the APK file for Google Play Store

echo "🚀 SISI Chat APK Build Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "capacitor.config.json" ]; then
    print_error "capacitor.config.json not found. Please run this script from the frontend directory."
    exit 1
fi

print_info "Starting SISI Chat APK build process..."
echo ""

# Step 1: Install dependencies
print_info "Step 1: Installing dependencies..."
if npm install --legacy-peer-deps; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""

# Step 2: Build the React app
print_info "Step 2: Building React application..."
if npm run build; then
    print_status "React app built successfully"
else
    print_error "Failed to build React app"
    exit 1
fi

echo ""

# Step 3: Generate app icons
print_info "Step 3: Generating app icons..."
if node generate-icons.js; then
    print_status "App icons generated successfully"
else
    print_error "Failed to generate app icons"
    exit 1
fi

echo ""

# Step 4: Copy files to Android project
print_info "Step 4: Copying files to Android project..."
if npx cap copy android; then
    print_status "Files copied to Android project"
else
    print_error "Failed to copy files to Android project"
    exit 1
fi

echo ""

# Step 5: Sync with Android project
print_info "Step 5: Syncing with Android project..."
if npx cap sync android; then
    print_status "Android project synced successfully"
else
    print_error "Failed to sync Android project"
    exit 1
fi

echo ""

# Step 6: Generate additional Play Store assets
print_info "Step 6: Generating Play Store assets..."
if node create-play-store-assets.js; then
    print_status "Play Store assets generated successfully"
else
    print_error "Failed to generate Play Store assets"
    exit 1
fi

echo ""

print_status "Build preparation completed successfully! 🎉"
echo ""
echo "📱 Next Steps:"
echo "1. Open Android Studio"
echo "2. Open the 'android' folder as a project"
echo "3. Wait for Gradle sync to complete"
echo "4. Go to Build → Generate Signed Bundle/APK"
echo "5. Select APK and follow the signing process"
echo ""
print_info "Your APK will be generated in: android/app/release/app-release.apk"
echo ""
print_status "All Play Store assets are ready in the current directory!"
echo ""

# List all generated files
echo "📦 Generated files:"
echo "   🎨 App Icons: android/app/src/main/res/mipmap-*/"
echo "   📱 Play Store Icon: play-store-icon.png (1024x1024)"
echo "   🖼️ Feature Graphic: feature-graphic.png (1024x500)"
echo "   📺 TV Banner: tv-banner-1280x720.png"
echo "   📲 Promo Banner: promo-banner-320x180.png"
echo "   📱 Social Media: instagram-post-1080x1080.png"
echo "   🐦 Twitter Header: twitter-header-1500x500.png"
echo "   📋 Privacy Policy: PRIVACY_POLICY.md"
echo "   📄 Terms of Service: TERMS_OF_SERVICE.md"
echo "   📖 Build Guide: PLAY_STORE_COMPLETE_GUIDE.md"
echo ""

print_warning "Remember to:"
echo "   • Test the APK on a real device before submitting"
echo "   • Create your keystore file and keep it safe"
echo "   • Update the privacy policy URL in Play Console"
echo "   • Take screenshots of your app for the store listing"
echo ""

print_status "SISI Chat is ready for Google Play Store! 🚀🧡"