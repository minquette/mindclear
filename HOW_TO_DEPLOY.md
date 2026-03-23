# 🏡 MindClear — How to Get This on Your Phone

A plain-English guide. No coding experience needed.

---

## What you'll end up with

- MindClear running at a web address like `mindclear.vercel.app`
- An icon on your iPhone home screen that opens it like a real app
- A link you can send to friends (iPhone or Android) so they can install it too
- All for free

**Total time: about 30–45 minutes**

---

## Step 1 — Install the tools on your computer

You need two free things installed on your computer (Mac or Windows).

### 1a. Node.js
This is the engine that builds the app.

1. Go to **[nodejs.org](https://nodejs.org)**
2. Click the big green **"LTS"** button to download
3. Open the downloaded file and follow the installer (just keep clicking Next/Continue)
4. When it's done, open **Terminal** (Mac: press `Cmd + Space`, type "Terminal") or **Command Prompt** (Windows: press the Windows key, type "cmd")
5. Type this and press Enter:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. If you do, Node is installed. ✅

### 1b. A free GitHub account
This is where your app code will live.

1. Go to **[github.com](https://github.com)** and click Sign Up
2. Choose the free plan
3. Verify your email

---

## Step 2 — Put the project files somewhere on your computer

1. Download the **MindClear project zip** (the file you received alongside this guide)
2. Unzip it — you should have a folder called `mindclear-pwa`
3. Move this folder somewhere easy to find, like your Desktop or Documents

---

## Step 3 — Install the app's dependencies

This is a one-time step that downloads everything the app needs to run.

1. Open **Terminal** (Mac) or **Command Prompt** (Windows)
2. Navigate to your project folder by typing:
   ```
   cd Desktop/mindclear-pwa
   ```
   (If you put it in Documents instead: `cd Documents/mindclear-pwa`)
3. Type this and press Enter:
   ```
   npm install
   ```
4. Wait for it to finish — it'll print a lot of text, that's normal. When you see the cursor blinking again, it's done. ✅

### Optional: Test it on your computer first
Type this:
```
npm run dev
```
Then open your browser and go to `http://localhost:5173` — you should see MindClear running! Press `Ctrl+C` in the terminal when you're done.

---

## Step 4 — Build the app

This packages everything up ready to go live.

In your terminal (make sure you're still in the `mindclear-pwa` folder):
```
npm run build
```

A new folder called `dist` will appear inside your project folder. That's your finished app. ✅

---

## Step 5 — Put it on GitHub

1. Go to **[github.com](https://github.com)** and log in
2. Click the **+** button in the top right → **New repository**
3. Name it `mindclear` (all lowercase)
4. Leave everything else as default, click **Create repository**
5. GitHub will show you a page with some commands. Copy and run these in your terminal one at a time:

```
git init
git add .
git commit -m "my mindclear app"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/mindclear.git
git push -u origin main
```

*(Replace YOURUSERNAME with your actual GitHub username)*

When it asks for your username and password, use your GitHub details. ✅

---

## Step 6 — Deploy to Vercel (this makes it live on the internet)

1. Go to **[vercel.com](https://vercel.com)**
2. Click **Sign Up** → choose **Continue with GitHub** — this links your accounts
3. Once logged in, click **Add New → Project**
4. You should see your `mindclear` repository listed — click **Import**
5. Vercel will detect it's a Vite project automatically
6. Click **Deploy**
7. Wait about 60 seconds… 🎉

Vercel will give you a link like `mindclear-abc123.vercel.app`. That's your app, live on the internet!

**Optional — get a nicer link:**
In your Vercel project settings you can change the URL to something like `mindclear-yourname.vercel.app` for free.

---

## Step 7 — Install it on your iPhone

1. Open **Safari** on your iPhone (must be Safari, not Chrome)
2. Go to your Vercel link
3. Tap the **Share button** (the box with an arrow pointing up, at the bottom of the screen)
4. Scroll down and tap **"Add to Home Screen"**
5. Give it a name (e.g. "MindClear") and tap **Add**

You'll now have a MindClear icon on your home screen. Tap it — it opens full screen, no browser bar, just like a real app. ✅

---

## Step 8 — Share it with friends

**For iPhone friends:**
Send them your Vercel link and tell them:
> "Open this in Safari, then tap the Share button → Add to Home Screen"

**For Android friends:**
Send them your Vercel link. Chrome on Android will automatically show a little banner saying "Add to Home Screen" or they can tap the three-dot menu and choose it.

---

## How to update the app in future

If you ever want to make changes (even just to the task list or cottage decorations), the process is:

1. Edit the files on your computer
2. In terminal: `git add . && git commit -m "updates" && git push`
3. Vercel automatically detects the change and redeploys in about 60 seconds
4. Everyone with the link gets the update next time they open the app

---

## Something went wrong?

**"Command not found" when typing npm:**
→ Node.js didn't install properly. Try downloading it again from nodejs.org.

**The Vercel build failed:**
→ Make sure you ran `npm install` in Step 3 before pushing to GitHub.

**The icon looks like a browser icon on iPhone:**
→ Make sure you're using Safari (not Chrome) to add it to your home screen.

**I can't find my terminal / command prompt:**
→ Mac: Press `Cmd + Space`, type "Terminal", press Enter
→ Windows: Press Windows key, type "cmd", press Enter

---

*Built with love. You've got this. 🌿*
