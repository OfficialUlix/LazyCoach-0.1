# LazyCoach iPhone Testing Guide

## Testing on Personal iPhone Without Paid Apple Developer Account

### Method 1: Expo Go (Current - SDK 52 Compatible)
1. **Install Expo Go** from the App Store
2. **Start the development server**:
   ```bash
   npm start
   # or
   npx expo start
   ```
3. **Connect your iPhone**:
   - Ensure iPhone and computer are on the same Wi-Fi network
   - Open Expo Go app
   - Scan the QR code from the terminal/browser
   - App will load directly in Expo Go

**Note**: This method works with your current SDK 52 setup.

### Method 2: Direct Install (Requires Xcode)
1. **Open project in Xcode**:
   ```bash
   npx expo run:ios
   ```
   - This will open the project in Xcode automatically

2. **Configure signing**:
   - In Xcode, select your project → Target "LazyCoach"
   - Go to "Signing & Capabilities"
   - Team: Select your Apple ID (personal team)
   - Bundle Identifier: Change to something unique like `com.yourname.lazycoach`

3. **Connect iPhone**:
   - Connect via USB
   - Trust the computer on your iPhone
   - Select your device from the device dropdown in Xcode
   - Click the play button to build and install

4. **Trust the app**:
   - On iPhone: Settings → General → VPN & Device Management
   - Find your developer profile and trust it

### Method 3: TestFlight (Future Option)
Once you're ready for wider testing:
1. Create a free Apple Developer account
2. Use EAS Build to create an iOS build:
   ```bash
   npx eas build --platform ios
   ```
3. Upload to TestFlight for internal testing

### Troubleshooting
- **"Untrusted Enterprise Developer"**: Go to iPhone Settings → General → Profiles & Device Management → Trust the developer
- **Build fails**: Check Bundle Identifier is unique
- **Can't find device**: Ensure iPhone is connected and trusted
- **Expo Go issues**: Make sure both devices are on same network

### Current Setup Benefits
- Your app uses Expo SDK 52 which is currently supported by Expo Go
- All necessary configurations are already in place
- Bundle identifier: `com.lazycoach.app` (change if needed for personal testing)

### Quick Start Commands
```bash
# Start development server
npm start

# Build for iOS simulator (if you have Xcode)
npm run ios

# Check iOS setup
npx expo doctor
```