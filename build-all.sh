#!/bin/bash
# Build and deploy SimLibrary to both iPhone and iPad

echo "🔄 Syncing web assets..."
cp js/*.js www/js/
cp css/*.css www/css/
cp index.html www/
npx cap sync ios

echo ""
echo "📱 Building for iPhone..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -destination 'platform=iOS,name=iPhone (2)' -derivedDataPath build build 2>&1 | grep -E "(BUILD|error:)"

echo ""
echo "📲 Installing on iPhone..."
xcrun devicectl device install app --device "iPhone (2)" build/Build/Products/Debug-iphoneos/App.app 2>&1 | grep -E "(installed|error)"

echo ""
echo "🖥️  Building for iPad Simulator..."
xcodebuild -project App.xcodeproj -scheme App -destination 'platform=iOS Simulator,name=iPad (A16)' -derivedDataPath build build 2>&1 | grep -E "(BUILD|error:)"

echo ""
echo "📲 Installing on iPad..."
xcrun simctl boot "iPad (A16)" 2>/dev/null
xcrun simctl install "iPad (A16)" build/Build/Products/Debug-iphonesimulator/App.app

echo ""
echo "🚀 Launching apps..."
xcrun devicectl device process launch --device "iPhone (2)" com.tatooedlaura.simlibrary 2>&1 | grep -E "(Launched|error)"
xcrun simctl launch "iPad (A16)" com.hamburglibrary.simlibrary 2>/dev/null

echo ""
echo "✅ Done! Both devices updated."
