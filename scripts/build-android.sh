#!/bin/bash

# BitStark Android Build Script
# This script builds the Android app locally without using Expo's cloud build service

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Starting BitStark Android build process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI not found. Installing..."
    npm install -g @expo/cli
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_warning "EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

print_status "Installing dependencies..."
npm install

print_status "Clearing Metro cache..."
npx expo start --clear

print_status "Building Android app..."

# Option 1: Use EAS Build locally (recommended)
if command -v eas &> /dev/null; then
    print_status "Using EAS Build for local Android build..."
    
    # Check if eas.json exists, if not create it
    if [ ! -f "eas.json" ]; then
        print_status "Creating eas.json configuration..."
        cat > eas.json << EOF
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF
    fi
    
    # Build for preview (APK)
    print_status "Building APK for testing..."
    eas build --platform android --profile preview --local
    
    print_success "Android APK built successfully!"
    print_status "APK location: ./builds/android-preview.apk"
    
    # Ask if user wants to build production AAB
    read -p "Do you want to build a production AAB file? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building production AAB..."
        eas build --platform android --profile production --local
        print_success "Production AAB built successfully!"
        print_status "AAB location: ./builds/android-production.aab"
    fi

else
    # Option 2: Use Expo's prebuild and Android Studio
    print_status "EAS CLI not available. Using Expo prebuild method..."
    
    print_status "Running Expo prebuild..."
    npx expo prebuild --platform android --clean
    
    print_status "Building with Gradle..."
    cd android
    
    # Check if Android SDK is available
    if [ -z "$ANDROID_HOME" ]; then
        print_warning "ANDROID_HOME not set. Please set your Android SDK path."
        print_status "Example: export ANDROID_HOME=/Users/username/Library/Android/sdk"
        exit 1
    fi
    
    # Build debug APK
    ./gradlew assembleDebug
    
    print_success "Debug APK built successfully!"
    print_status "APK location: ./android/app/build/outputs/apk/debug/app-debug.apk"
    
    # Ask if user wants to build release APK
    read -p "Do you want to build a release APK? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building release APK..."
        ./gradlew assembleRelease
        print_success "Release APK built successfully!"
        print_status "APK location: ./android/app/build/outputs/apk/release/app-release.apk"
    fi
    
    cd ..
fi

print_success "Android build process completed!"
print_status "You can now install the APK on your Android device or emulator."

# Optional: Install on connected device
if command -v adb &> /dev/null; then
    read -p "Do you want to install the APK on a connected Android device? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Find the most recent APK
        APK_PATH=$(find . -name "*.apk" -type f -exec ls -t {} + | head -n 1)
        if [ -n "$APK_PATH" ]; then
            print_status "Installing APK on connected device..."
            adb install -r "$APK_PATH"
            print_success "APK installed successfully!"
        else
            print_error "No APK file found to install."
        fi
    fi
else
    print_warning "ADB not found. Cannot auto-install on device."
    print_status "You can manually install the APK using: adb install path/to/your.apk"
fi

print_success "Build script completed successfully!"
