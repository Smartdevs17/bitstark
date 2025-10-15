#!/bin/bash

# BitStark Build Script
# This script builds Android and iOS apps locally without using Expo's cloud build service

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [android|ios|both]"
    echo ""
    echo "Options:"
    echo "  android    Build Android app only"
    echo "  ios        Build iOS app only"
    echo "  both       Build both Android and iOS apps"
    echo ""
    echo "If no argument is provided, you'll be prompted to choose."
}

# Parse command line arguments
PLATFORM=""
if [ $# -eq 0 ]; then
    echo "Select platform to build:"
    echo "1) Android"
    echo "2) iOS"
    echo "3) Both"
    read -p "Enter your choice (1-3): " choice
    case $choice in
        1) PLATFORM="android" ;;
        2) PLATFORM="ios" ;;
        3) PLATFORM="both" ;;
        *) print_error "Invalid choice. Exiting."; exit 1 ;;
    esac
elif [ "$1" = "android" ] || [ "$1" = "ios" ] || [ "$1" = "both" ]; then
    PLATFORM="$1"
else
    show_usage
    exit 1
fi

print_status "Starting BitStark build process for: $PLATFORM"

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

# Note: This script uses native build tools (Gradle/Xcode) instead of EAS
print_status "Using native build tools for local builds..."

print_status "Installing dependencies..."
npm install

# Function to build Android
build_android() {
    print_status "Building Android app using native Gradle build..."
    
    # Check if Android SDK is available
    if [ -z "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME not set. Please set your Android SDK path."
        print_status "Example: export ANDROID_HOME=/Users/username/Library/Android/sdk"
        print_status "You can also set it in your ~/.zshrc or ~/.bashrc file"
        exit 1
    fi
    
    # Check if Java is available
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed. Please install Java JDK 11 or higher."
        exit 1
    fi
    
    print_status "Running Expo prebuild for Android..."
    npx expo prebuild --platform android --clean
    
    print_status "Building with Gradle..."
    cd android
    
    # Build debug APK
    print_status "Building debug APK..."
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
    
    # Ask if user wants to build AAB
    read -p "Do you want to build an Android App Bundle (AAB)? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building Android App Bundle..."
        ./gradlew bundleRelease
        print_success "AAB built successfully!"
        print_status "AAB location: ./android/app/build/outputs/bundle/release/app-release.aab"
    fi
    
    cd ..
}

# Function to build iOS
build_ios() {
    print_status "Building iOS app using native Xcode build..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds can only be done on macOS."
        exit 1
    fi
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode is not installed. Please install Xcode from the App Store."
        exit 1
    fi
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        print_error "CocoaPods is not installed. Please install CocoaPods:"
        print_status "sudo gem install cocoapods"
        exit 1
    fi
    
    print_status "Running Expo prebuild for iOS..."
    npx expo prebuild --platform ios --clean
    
    print_status "Installing iOS dependencies with CocoaPods..."
    cd ios
    pod install
    cd ..
    
    print_status "Building with Xcode..."
    cd ios
    
    # Build for simulator
    print_status "Building for iOS Simulator..."
    xcodebuild -workspace BitStark.xcworkspace -scheme BitStark -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build
    
    print_success "iOS Simulator build completed successfully!"
    print_status "App location: ./ios/build/BitStark.app"
    
    # Ask if user wants to build for device
    read -p "Do you want to build for iOS device (requires signing)? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building for iOS device..."
        xcodebuild -workspace BitStark.xcworkspace -scheme BitStark -configuration Release -destination generic/platform=iOS -archivePath BitStark.xcarchive archive
        
        print_success "iOS device build completed successfully!"
        print_status "Archive location: ./ios/BitStark.xcarchive"
        
        # Ask if user wants to export IPA
        read -p "Do you want to export an IPA file? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Exporting IPA..."
            xcodebuild -exportArchive -archivePath BitStark.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist
            
            print_success "IPA exported successfully!"
            print_status "IPA location: ./ios/build/BitStark.ipa"
        fi
    fi
    
    cd ..
}

# Execute builds based on platform selection
case $PLATFORM in
    "android")
        build_android
        ;;
    "ios")
        build_ios
        ;;
    "both")
        build_android
        echo ""
        build_ios
        ;;
esac

print_success "Build process completed successfully!"
print_status "Check the output above for the location of your built app(s)."

# Optional: Install on connected device (Android only)
if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
    if command -v adb &> /dev/null; then
        read -p "Do you want to install the Android APK on a connected device? (y/n): " -n 1 -r
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
fi

print_success "Build script completed successfully!"
