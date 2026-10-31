import JSZip from 'jszip';

export async function generateAndroidProjectZip(appName: string = 'JARVIS M.V. AI'): Promise<Blob> {
  const zip = new JSZip();

  // Root project files
  zip.file(
    'settings.gradle',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "JarvisMV"
include ':app'
`
  );

  zip.file(
    'build.gradle',
    `// Top-level build file
plugins {
    id 'com.android.application' version '8.2.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.22' apply false
}
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=256m
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=true
`
  );

  // app/build.gradle
  zip.file(
    'app/build.gradle',
    `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.jarvis.ai'
    compileSdk 34

    defaultConfig {
        applicationId "com.jarvis.ai"
        minSdk 27 // Android 8.1 Oreo (Samsung Galaxy A2 Core)
        targetSdk 34
        versionCode 1
        versionName "2.5.0-mobile"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }

    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a"
            universalApk true // Builds Universal APK compatible with Samsung A2 Core
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.webkit:webkit:1.10.0'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
}
`
  );

  // app/src/main/AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions required for JARVIS M.V. Voice & Vision -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.microphone" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.JarvisAI"
        android:hardwareAccelerated="true"
        android:largeHeap="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.JarvisAI.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`
  );

  // app/src/main/java/com/jarvis/ai/MainActivity.kt
  zip.file(
    'app/src/main/java/com/jarvis/ai/MainActivity.kt',
    `package com.jarvis.ai

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val PERMISSIONS_REQUEST_CODE = 101

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 8.1 Oreo Low RAM Optimization: Hardware acceleration + full screen
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        )

        webView = WebView(this)
        setContentView(webView)

        checkPermissions()
        setupWebView()

        // Load the live hosted JARVIS instance or local bundle
        val appUrl = "https://ais-pre-5zpxpusk7qxsrosn3r7czj-792117591950.asia-east1.run.app"
        webView.loadUrl(appUrl)
    }

    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA
        )
        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSIONS_REQUEST_CODE)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Optimize for 1GB RAM Samsung Galaxy A2 Core
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.safeBrowsingEnabled = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("tel:") || url.startsWith("sms:") || url.startsWith("mailto:") || url.startsWith("geo:")) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`
  );

  // app/src/main/res/values/styles.xml
  zip.file(
    'app/src/main/res/values/styles.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.JarvisAI" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="android:windowBackground">#030712</item>
        <item name="android:statusBarColor">#030712</item>
        <item name="android:navigationBarColor">#030712</item>
    </style>
    <style name="Theme.JarvisAI.Fullscreen" parent="Theme.JarvisAI">
        <item name="android:windowFullscreen">false</item>
    </style>
</resources>
`
  );

  // GitHub Actions Workflow to build APK in cloud for free
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Android Universal APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Android SDK
      uses: android-actions/setup-android@v3

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew || true

    - name: Build Universal APK with Gradle
      run: ./gradlew assembleRelease --stacktrace

    - name: Upload APK Artifact
      uses: actions/upload-artifact@v3
      with:
        name: Jarvis-MV-Android-Universal-APK
        path: app/build/outputs/apk/release/*.apk
`
  );

  // Complete instructions README
  zip.file(
    'README-BUILD-APK.md',
    `# JARVIS M.V. AI - Android Universal APK Build Package

Designed for: Samsung Galaxy A2 Core (Android 8.1 Oreo, 1 GB RAM, ARMv7 32-bit).

## Option 1: 1-Click Native WebAPK Install (Recommended for Galaxy A2 Core)
1. Open this app in Google Chrome on your Samsung Galaxy A2 Core.
2. Tap the "Install App" button in the JARVIS HUD or tap Chrome Menu (3 dots) -> "Add to Home Screen" or "Install App".
3. Chrome compiles a native WebAPK package and installs it into your Android app drawer.
4. It runs in standalone mode with full hardware acceleration and zero memory waste!

## Option 2: Build Standalone APK with Android Studio
1. Download and extract this ZIP file.
2. Open Android Studio -> "Open Project" -> select this extracted directory.
3. Wait for Gradle sync to complete.
4. Click Menu "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)".
5. Android Studio outputs:
   - \`app-armeabi-v7a-release.apk\` (perfect for Samsung Galaxy A2 Core ARMv7)
   - \`app-universal-release.apk\` (universal APK for any Android device)
6. Transfer the APK to your phone and install!

## Option 3: Free Cloud Build via GitHub Actions
1. Push this project to a free GitHub repository.
2. Go to the "Actions" tab.
3. The included \`.github/workflows/build-apk.yml\` will automatically build the APK and give you a direct download link!
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
