# How to Install on Your Vivo Y19s / Vivo Y39 (Via USB)

This guide helps you export this project from Google AI Studio and build the installation files (`.apk` or `.aab`) on your computer, then install it directly to your physical **Vivo Y19s / Vivo Y39** phone via a USB cable.

---

## Why we can't compile the APK directly in the online browser
The online Google AI Studio runs in a simplified web coding environment. Building a mobile Android app (`.apk`) requires heavy system software including the **Java Development Kit (JDK)**, **Android SDK**, and **Gradle**. Since those massive packages cannot run inside this cloud container, the final bundle must be built on your computer. 

All mobile code is fully prepared for you inside the code folders!

---

## Step 1: Download This Project
1. In Google AI Studio, look at the top right of the editor or settings menu.
2. Click **Export** or **Download ZIP** to save the entire project onto your computer.
3. Extract (unzip) the file into a folder on your computer.

---

## Step 2: Prepare Your Computer (One-time Setup)
Ensure you have the following installed on your computer:
1. **Node.js**: [Download and install Node.js](https://nodejs.org/). This compiles the React code.
2. **Android Studio**: [Download and install Android Studio](https://developer.android.com/studio). This automatically installs the **Android SDK**, **JDK**, and **Gradle** for you.

---

## Step 3: Prepare Your Vivo Phone (Enable USB Debugging)
To allow your computer to install the app on your Vivo phone over USB:
1. Open **Settings** on your Vivo Y19s / Vivo Y39.
2. Go to **About Phone** (or **System management** > **About phone**).
3. Tap **Software version** (or **Build number**) **7 times** until you see a message saying *"You are now a developer!"*.
4. Go back to the main **Settings** page.
5. Go to **System** (or **System management** / **More settings**).
6. Open **Developer options**.
7. Enable the following settings:
   - **USB Debugging** (Allows computer connection)
   - **Install via USB** (Required by Vivo to allow app installations from USB)

---

## Step 4: Build Your App (IMPORTANT: DO NOT SKIP ANY STEP)
On your computer, open your terminal (Command Prompt on Windows, Terminal on Mac) inside your extracted project folder and run these three commands in order.

### 1. Install project dependencies (CRITICAL)
This step downloads all the tools (like Vite) needed to build your app. If you skip this, you will see the error: *"'vite' is not recognized"*.

```bash
npm install
```

### 2. Build the web app
Once the installation above is finished, run this to compile your React code:

```bash
npm run build
```

### 3. Copy the compiled files into your Android project
Finally, sync the built files to the native Android folder:

```bash
npx cap sync
```

---

## Step 5: Install on Your Vivo Y19s / Vivo Y39 Phone

### Option A: Run directly from Android Studio (easiest and fastest)
1. Open **Android Studio** on your computer.
2. Click **Open** and select the `/android` folder inside your project.
3. Plug your Vivo phone into your computer using a USB cable. (If prompted on your phone, choose "Transfer files" and accept "Allow USB debugging").
4. In Android Studio, look at the top toolbar. You should see your **Vivo Y19s / Vivo Y39** model listed in the devices dropdown.
5. Click the green **Run (Play button)** icon. Android Studio will automatically build the APK and install it directly to your phone!

---

## How to Use "Device Manager" in Android Studio

Android Studio's **Device Manager** is the control panel for all your target test environments. It lets you connect physical phones (via USB or Wi-Fi) and run virtual phone emulators on your computer screen.

### 1. Opening the Device Manager
To open the Device Manager in Android Studio:
- **On the top right toolbar**: Click the mobile phone icon with a small gear/wrench (**Device Manager** icon).
- **Using the top menu**: Go to **Tools** > **Device Manager**.
- A panel will slide open on the right side of Android Studio showing two tabs: **Physical** and **Virtual**.

---

### 2. Managing Physical Devices (Your Vivo Phone)
Under the **Physical** tab of the Device Manager, you can monitor and connect your physical Vivo phone.

#### Method A: USB Connection (Recommended)
1. Enable USB Debugging on your phone (see **Step 3** above).
2. Connect your phone to your computer with a high-quality USB cable.
3. Your **Vivo Y19s / Vivo Y39** should instantly appear under the **Physical** list with a green status dot showing it is online.
4. In the main toolbar's device dropdown (usually next to the green Play button), select your Vivo phone, then click **Run** (Play button) to install and launch the app.

#### Method B: Wireless / Wi-Fi Connection (Android 11+)
If you don't want to use a USB cable, you can connect wirelessly as long as your computer and Vivo phone are on the **same Wi-Fi network**:
1. In the **Device Manager**, click the **Physical** tab.
2. Click **Pair Devices Using Wi-Fi** at the top of the panel. A dialog with a **QR Code** and a **Pairing Code** will appear.
3. On your Vivo phone, go to **Settings** > **System** > **Developer Options**.
4. Scroll down and tap **Wireless debugging** to turn it on.
5. Tap **Wireless debugging** itself (not just the switch) to open its settings, then select:
   - **Pair device with QR code**: Point your phone camera at the QR code on your computer screen.
   - OR **Pair device with pairing code**: Enter the 6-digit code shown on your phone into Android Studio.
6. Once paired, your Vivo phone will show up in the Device Manager without any cables!

---

### 3. Managing Virtual Devices (Android Emulators)
If you don't have your phone handy, you can create a virtual phone (emulator) to run right on your computer.

1. Open the **Device Manager** and click the **Virtual** tab.
2. Click **Create Device** (or **+ Create Virtual Device**).
3. **Choose Hardware**: Select a template (for example, **Pixel 7** or **Pixel 8**) and click **Next**.
4. **System Image**: Choose an Android version to download. 
   - We recommend choosing **API 33** (Android 13) or **API 34** (Android 14) from the list.
   - Click the **Download arrow** next to the version name. Once the download finishes, select that row and click **Next**.
5. **Verify Configuration**: Give your virtual device a name (e.g., "Pixel 7 Emulator") and click **Finish**.
6. **Launch the Emulator**: In the Virtual Device list, click the green **Play (Launch)** button next to your new virtual device. A realistic phone screen will slide open on your computer screen.
7. Once the emulator is running, select it in the top target devices dropdown menu and click **Run** (Play button) to install the local cricket app on it!

---

### Option B: Build a standalone APK file
1. In Android Studio, go to the top menu bar.
2. Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. When the build is done, a pop-up in the bottom right corner will show *"APK(s) generated successfully"*. Click **Locate**.
4. Copy the file named `app-debug.apk` to your phone (via USB, email, or Google Drive) and tape the file on your Vivo phone to install it!
