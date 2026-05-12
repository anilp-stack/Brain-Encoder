# 🧠 ADVantage Insights — Brain Encoder Platform

> AI-Powered Creative Intelligence. Upload any ad creative. Get a full neural analysis.

---

## What This Platform Does

The **Brain Encoder** analyzes video ads, display creatives, and social content using AI to produce:

### 17 Performance Metrics (Beyond Higgsfield's 4)
| Metric | Higgsfield | Brain Encoder |
|--------|-----------|---------------|
| Viral Potential | ✅ | ✅ |
| Hook Strength | ✅ | ✅ |
| Hold Rate | ✅ | ✅ |
| Brain Heatmap | ✅ (simplified) | ✅ (8 regions) |
| Memory Encoding | ❌ | ✅ |
| Sound-Off Survival | ❌ | ✅ |
| Creative Efficiency | ❌ | ✅ |
| Share Intent | ❌ | ✅ |
| Ad Fatigue Risk | ❌ | ✅ |
| Cultural Resonance | ❌ | ✅ |
| System 1/2 Balance | ❌ | ✅ |
| 1P Data Opportunity | ❌ | ✅ |
| Celebrity/Talent ROI | ❌ | ✅ |
| Brand Safety | ❌ | ✅ |
| Regulatory Compliance | ❌ | ✅ |
| Carbon Signal | ❌ | ✅ |
| 15 Platform Scores | ❌ (one score) | ✅ |

### 10 Dashboard Tabs
1. **Executive Summary** — All scores, attention/emotion curves, competitive benchmark
2. **Neural Activation Map** — 8 brain regions, 7 cognitive channels, System 1/2 gauge
3. **Attention Economics** — Heatmap, drop zones, view-through predictions
4. **Emotional Architecture** — 6 emotion types over time, valence curves
5. **Scene Intelligence** — Frame-by-frame analysis with badges
6. **Platform Intelligence** — 15 platform-specific scores
7. **Sound & Sensory** — Audio dependency, sound-off risk, sonic branding
8. **Privacy & Compliance** — DPDP, QR codes, disclaimers, data flow audit
9. **Strategic Insights** — 6-8 numbered insights with verdicts
10. **CMO Playbook** — Prioritized actions with effort/impact ratings

### No Limits
- No 15-second duration cap (analyze any length)
- Supports video AND static display/image ads
- Full explainability (which frame causes which score)
- Per-platform scoring (not one aggregate)

---

## Architecture

```
brain-encoder/
├── index.html              # HTML entry point
├── src/
│   ├── main.jsx            # React entry
│   └── App.jsx             # Full application (landing + form + analysis + dashboard)
├── netlify/
│   └── functions/
│       └── analyze.js      # Serverless backend (proxies to Claude API)
├── package.json            # Dependencies
├── vite.config.js          # Build config
├── netlify.toml            # Netlify deployment config
├── .env.example            # Environment variables template
└── README.md               # This file
```

**How it works:**
1. User uploads creative + fills brief → React frontend extracts video frames
2. Frames sent to `/netlify/functions/analyze` serverless function
3. Function calls Anthropic Claude API with frames + mega analysis prompt
4. Claude returns structured JSON with all 17 metrics + insights
5. Frontend renders the interactive multi-tab dashboard

---

## Step-by-Step Deployment (Netlify)

### Prerequisites
- A **GitHub account** (free)
- A **Netlify account** (free tier works — https://netlify.com)
- An **Anthropic API key** (from https://console.anthropic.com)

### Step 1: Get the Code onto GitHub

**Option A: Upload directly**
1. Go to https://github.com/new
2. Create a new repository named `brain-encoder`
3. Upload all the files from this project folder
4. Make sure the folder structure matches exactly

**Option B: Git command line**
```bash
cd brain-encoder
git init
git add .
git commit -m "Initial commit - Brain Encoder Platform"
git remote add origin https://github.com/YOUR_USERNAME/brain-encoder.git
git push -u origin main
```

### Step 2: Deploy on Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize Netlify
4. Select your `brain-encoder` repository
5. Build settings should auto-detect from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
6. Click **"Deploy site"**

### Step 3: Set Environment Variables

1. In Netlify dashboard → your site → **Site configuration** → **Environment variables**
2. Add these variables:

| Key | Value | Required? |
|-----|-------|-----------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (your key from console.anthropic.com) | **YES** |
| `ACCESS_PASSWORD` | Any password string (leave empty for open access) | Optional |

3. After adding variables, go to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 4: Test It

1. Visit your Netlify URL (e.g., `https://your-site-name.netlify.app`)
2. Click "Start Analysis"
3. Fill in brand details and upload a video or image
4. Click "Run Brain Encoder Analysis"
5. Wait 30-60 seconds for the full analysis

### Step 5: Custom Domain (Optional)

1. Netlify dashboard → **Domain management** → **Add custom domain**
2. Enter your domain (e.g., `brain.advantageinsights.com`)
3. Follow DNS setup instructions (add CNAME record)
4. Netlify provides free HTTPS automatically

---

## Customization

### Password Protection
Set `ACCESS_PASSWORD` in Netlify environment variables. Users will need to enter this code in the "Access Code" field on the upload form.

### Branding
The platform is branded as "ADVantage Insights — Brain Encoder" throughout. To change:
- Edit branding text in `src/App.jsx`
- Search for "ADVantage Insights" and replace

### Adding More Analysis Dimensions
The analysis prompt lives in `netlify/functions/analyze.js`. The `systemPrompt` variable contains the full specification. Add new metrics by:
1. Adding them to the prompt specification
2. Adding corresponding UI elements in `src/App.jsx`

---

## Cost Estimate

| Item | Cost |
|------|------|
| Netlify hosting | Free (starter tier) |
| Netlify functions | Free (125K requests/month) |
| Anthropic API | ~$0.15-0.30 per analysis (depends on video length/frames) |
| Custom domain | ~$12/year (optional) |

**At 100 analyses/month:** ~$20-30/month total

---

## Security Notes

- API key is **server-side only** (in Netlify function, never exposed to browser)
- Optional password protection for access control
- Frames are processed in-memory and not stored
- No user data persists after the session

---

## For Industry Deployment

If you plan to offer this as a service to agencies and marketers:

### Recommended Additions
1. **User authentication** — Add Netlify Identity or Auth0 for proper login
2. **Usage tracking** — Add analytics (Mixpanel, PostHog) to track usage
3. **Report export** — Add PDF/PPTX export capability
4. **History** — Add Supabase backend to save past analyses
5. **Team features** — Multiple users per organization
6. **Billing** — Stripe integration for per-analysis or subscription pricing
7. **White-labeling** — Allow agencies to brand it themselves

### Scaling
- Netlify functions auto-scale
- For heavy usage, consider upgrading to Netlify Pro ($19/month)
- Anthropic API has rate limits — apply for higher limits if needed

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Add `ANTHROPIC_API_KEY` in Netlify env vars and redeploy |
| Analysis takes too long | Normal — Claude processes 4-8 frames. Expect 30-60s. |
| "Invalid access code" | Enter the ACCESS_PASSWORD you set, or remove the env var |
| Build fails | Check that all files are in the correct paths |
| Blank page | Check browser console for errors. Ensure env vars are set. |

---

**Built with ❤️ by ADVantage Insights**
