# Android Native Module

Android-specific native code and build configuration for React Native app.

## Structure

- **app/** — Android app module (main APK)
  - **src/main/AndroidManifest.xml** — App permissions, activities, broadcast receivers
  - **src/main/java/com/tempapp/** — Java/Kotlin code for native modules
  - **src/main/res/** — Android resources (strings, styles, icons, layouts)
  - **build.gradle** — App module build config (dependencies, signing, flavors)

- **build.gradle** — Project-level Gradle config
- **gradle.properties** — Global Gradle properties
- **settings.gradle** — Gradle project structure definition
- **gradle/wrapper/** — Gradle version wrapper

## Build Process

```
gradlew assembleRelease  →  Generates signed APK
gradlew bundleRelease    →  Generates Google Play Bundle (AAB)
```

## Manifest Permissions

Required permissions for the app:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## Signing Configuration

To release to Google Play Store:

1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `app/build.gradle`:
   ```gradle
   signingConfigs {
       release {
           storeFile file("my-release-key.keystore")
           storePassword "..."
           keyAlias "..."
           keyPassword "..."
       }
   }
   ```

3. Build signed APK:
   ```bash
   ./gradlew assembleRelease
   ```

## Firebase Integration

- **google-services.json** — Firebase configuration (in `app/src/main/`)
- Used by Firebase Analytics and other services
- Generated from Firebase Console

## Performance

- Multidex enabled for apps exceeding 65K methods
- ProGuard/R8 obfuscation for release builds
- ABI splits for reduced APK size (arm64-v8a, armeabi-v7a)
