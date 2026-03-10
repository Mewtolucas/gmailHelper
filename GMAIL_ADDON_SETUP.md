# 📧 Gmail Helper Add-on - Easy Setup

Want to use Gmail Helper directly in Gmail without any CLI or complex setup? This Gmail Add-on is for you!

## ⚡ One-Click Setup (5 minutes)

### Step 1: Create a Google Apps Script Project

1. Go to **[script.google.com](https://script.google.com)**
2. Click **New Project**
3. Ignore any starter code, it will be replaced

### Step 2: Copy the Add-on Code

1. Open `src/google-apps-script/gmail-addon.gs` from this project
2. Copy ALL the code
3. Paste it into your Apps Script project (replace everything)
4. Press **Ctrl+S** to save

### Step 3: Set Permissions

1. Click **Settings** (gear icon)
2. Under "General settings", check both:
   - ✅ "Execute apps as" → Select your Google account
   - ✅ "Who has access" → "Anyone"
3. Save

### Step 4: Deploy as Add-on

1. Click **Deploy** (top right)
2. Select **New Deployment**
3. Choose type: **Gmail Add-on**
4. Description: "Gmail Helper"
5. Click **Deploy**

### Step 5: Allow Permissions

1. Google will ask for permissions to access Gmail
2. Click **Continue** → Select your account
3. Click "**Allow**" (yes, it needs Gmail access)
4. Done! ✅

## 🎉 Now Use It!

Go to **Gmail.com** and you should see:

### In the Gmail Sidebar (right side):
- 📧 **Open Gmail Helper** - Opens the main interface
- ⭐ **Mark as VIP** - Quick add current sender to VIP
- 📌 **Pin Email** - Pin email to top
- ⚠️ **Mark Important** - Mark as important

### Open the Main Sidebar:
Click **📧 Open Gmail Helper** and you get 4 tabs:

#### 📧 **Inbox Tab**
- See your important emails
- Shows priority level (🔴 critical, 🟠 high, 🟡 medium, ⚫ low)
- See VIP status and categories
- Click email to select it

#### 📂 **Categorize Tab**
1. Select an email in your Gmail inbox
2. Click "Open Gmail Helper"
3. Go to **Categorize** tab
4. Click a category to apply it
5. Email gets labeled automatically ✅

Available categories:
- 🔴 Work
- 🔵 Personal
- 🟡 Shopping
- 💚 Finance
- ❤️ Social
- 🔷 Projects

#### ⭐ **VIP Tab**
- See all your VIP contacts
- Quick add current email sender
- Remove VIP contacts anytime
- VIP emails get special priority

#### 📊 **Stats Tab**
- Total emails in inbox
- How many are important
- VIP senders in your mail
- Spam/suspicious emails
- Categories applied

## 🚀 Features

✅ **Automatic Priority Detection**
- Detects urgency keywords: "urgent", "ASAP", "deadline", etc.
- Attachments = higher priority
- From VIP contacts = highest priority

✅ **VIP Management**
- Add any sender as VIP instantly
- VIP emails highlighted with ⭐
- Remove anytime

✅ **One-Click Categorization**
- Apply Gmail labels instantly
- Multiple categories per email
- Color-coded for easy identification

✅ **Smart Statistics**
- Know your email patterns
- Track important emails
- Monitor suspicious emails

✅ **No Passwords Needed**
- Uses Google's OAuth (safe)
- Stays in Gmail
- Doesn't require servers or external setup

## ❓ How It Works

1. **Reads emails from your Gmail**
2. **Analyzes** sender, subject, keywords
3. **Shows intelligence**: priority, VIP status, category
4. **Lets you act**: label, star, categorize with one click
5. **Saves to Gmail**: Uses Gmail's built-in labels

## 🔒 Privacy & Security

✅ **Your data stays private**
- Runs only in your Google Account
- No data sent to external servers
- Uses Gmail's native permissions
- You can revoke anytime

## 📝 Common Tasks

### Organize Work Emails
1. Open Gmail
2. Click "Open Gmail Helper"
3. Go to **Inbox** tab
4. Filter by priority
5. **Categorize** tab → Click "Work"

### Track Important People
1. **VIP Tab**
2. Click "Add Current Email Sender as VIP"
3. Their future emails get ⭐ priority

### See What's Important
1. **Inbox** tab → Click "Load Important"
2. See only critical/high priority emails
3. Shows VIP senders

### Find Your Stats
1. **Stats** tab
2. Click "Load Statistics"
3. See email breakdown

## 🐛 Troubleshooting

**Can't see the add-on?**
- Refresh Gmail (Ctrl+R)
- Wait 5 minutes after deployment
- Check if you're logged in

**Add-on won't open?**
- Go back to script.google.com
- Click **Run** next to `onOpen` function
- Grant permissions when asked
- Refresh Gmail

**Need to edit?**
- Go to script.google.com
- Find your project
- Edit the code
- Save (Ctrl+S)
- Changes apply immediately in Gmail

**Remove the add-on?**
- Gmail menu → Settings → Add-ons
- Find "Gmail Helper"
- Click remove

## 📚 Advanced: Add More Categories

Edit the `CONFIG` at the top:

```javascript
const CONFIG = {
  CATEGORIES: {
    'Work': '#FF6B6B',
    'Personal': '#4ECDC4',
    'Shopping': '#FFE66D',
    'Finance': '#95E1D3',
    'Social': '#FF7675',
    'Projects': '#74B9FF',
    'YOUR_NEW_CATEGORY': '#YOUR_COLOR'  // Add here
  }
}
```

Colors can be any hex code:
- #FF6B6B = Red
- #4ECDC4 = Cyan
- #FFE66D = Yellow
- #95E1D3 = Green
- etc.

## 💡 Tips

1. **Use keyboard shortcuts**: After adding to VIP, future emails auto-prioritize
2. **Batch operations**: Select multiple emails, then categorize
3. **Search smartly**: Use Gmail search combined with the add-on
4. **Check stats regularly**: See what categories you use most

## 🔄 Upgrade Path

This Gmail Add-on is perfect for getting started. When ready to use advanced features:

1. **Full CLI version** (on your computer)
   - AI-powered analysis with Claude
   - Advanced spam/phishing detection
   - Batch operations
   - Custom rules

2. **Sync with cloud backend**
   - Automated categorization
   - Cross-device synchronization
   - Scheduled actions

## ✨ What's Next?

Once you have the add-on working:
1. Try categorizing 10 emails
2. Add your boss/important contacts as VIP
3. Check statistics
4. Notice how priorities appear

Then upgrade to the full CLI for AI features!

---

**Need help?** The add-on code is in `src/google-apps-script/gmail-addon.gs`

Enjoy! 🎉
