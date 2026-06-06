# AdCritIQ™ Architecture Audit

This audit documents the current AdCritIQ™ codebase. Previously named Brain Encoder™, the platform was rebranded to AdCritIQ™ in June 2026. The Netlify files remain as backup while the active deployment target moves to Vercel.

## `src/App.jsx` `useState` Inventory

All `useState` hooks are declared at the top of `App()` before conditional rendering.

| Line | Hook |
| ---: | --- |
| 276 | `const [stage,setStage]=useState("landing");` |
| 277 | `const [form,setForm]=useState({brand:"",client:"",campaign:"",agency:"",type:"video",industry:"FMCG / CPG",audience:"",market:"India",notes:"",password:""});` |
| 278 | `const [file,setFile]=useState(null);` |
| 279 | `const [preview,setPreview]=useState(null);` |
| 280 | `const [progress,setProgress]=useState(0);` |
| 281 | `const [progressMsg,setProgressMsg]=useState("");` |
| 282 | `const [results,setResults]=useState(null);` |
| 283 | `const [error,setError]=useState(null);` |
| 284 | `const [tab,setTab]=useState("summary");` |
| 285 | `const [downloading,setDownloading]=useState(false);` |
| 286 | `const [gradeTooltipVisible,setGradeTooltipVisible]=useState(false);` |
| 287 | `const [methTab,setMethTab]=useState("overview");` |
| 288 | `const [savedAnalyses, setSavedAnalyses] = useState([]);` |
| 289 | `const [repoLoading, setRepoLoading] = useState(false);` |

## Data Flow

Current endpoint confirmation: `src/App.jsx` does **not** call `netlify/functions/analyze.js`. The active React fetch calls use Vercel-style `/api/*` routes.

1. **Upload and form state**
   - `stage` controls the current UI view: `landing`, `form`, `analyzing`, or `results`.
   - `form` stores brand, client, campaign, agency, creative type, industry, audience, market, notes, and password/access code.
   - `handleFile()` stores the selected `file` and creates `preview` as a data URL for images or an object URL for video.

2. **Frame extraction**
   - `extractFrames(file)` handles images and videos.
   - Images are read through `FileReader` and return one base64 JPEG payload with `isImage: true`.
   - Videos are loaded into a hidden `<video>`, sampled into a `320x180` canvas, encoded as JPEG at quality `0.3`, and return up to 2 frames with duration, dimensions, and `isImage: false`.
   - `netlify/functions/analyze.js` accepts up to 3 frames internally with `frames.slice(0, 3)` but is not the active frontend endpoint.
   - The currently wired React flow calls `/api/analyze-fast`, which uses 1 frame for images or up to 2 frames for videos.

3. **API call**
   - `handleAnalyze()` builds `payload = { frames: frameData.frames, metadata: { ...form, ...frameData } }`.
   - The current UI sends two parallel POST requests from `src/App.jsx`:
     - `POST /api/analyze-fast` from `fastPromise=fetch("/api/analyze-fast", ...)` at line 317.
     - `POST /api/analyze-rich` from `richPromise=fetch("/api/analyze-rich", ...)` at line 323.
   - Both requests use `Content-Type: application/json`.
   - On Vercel, these endpoints are implemented by `api/analyze-fast.js` and `api/analyze-rich.js`.
   - `api/analyze-fast.js` is the real long-running analysis endpoint with `maxDuration: 300`.
   - `api/analyze-rich.js` currently returns empty/null rich data by design with `maxDuration: 30`.
   - The requested `netlify/functions/analyze.js` schema is documented below for audit completeness, but that serverless function is not currently called by `src/App.jsx`.

4. **JSON response and React state**
   - Fast response must return `{ success: true, analysis }`.
   - Rich response returns `{ success: true, richData: null }` in the current Vercel migration phase; failures are logged and the UI continues with metrics-only data.
   - `combined` is created from `fastData` plus `richData.scenes`, `richData.strategic_insights`, and `richData.cmo_actions`.
   - `setResults(combined)`, `setStage("results")`, and `setTab("summary")` render the dashboard.

5. **Dashboard tabs**
   - `summary`: top performance metrics, attention/emotion curve, secondary metrics, competitive benchmark, summary takeaways.
   - `neural`: brain region activation, cognitive channel load, System 1/System 2 balance.
   - `attention`: second-by-second attention heatmap and view-through stats.
   - `emotion`: emotion type curves and emotional peak analysis.
   - `scenes`: scene intelligence cards from `results.scenes`.
   - `platforms`: 15 platform suitability scores from `results.platform_scores`.
   - `sound`: sound and sensory metrics from `results.sound_analysis`.
   - `privacy`: privacy, DPDP, brand-safety, and regulatory compliance signals.
   - `strategy`: strategic insight cards from `results.strategic_insights`.
   - `cmo`: prioritized action cards from `results.cmo_actions`.
   - `methodology`: internal methodology sub-tabs controlled by `methTab`.
   - `repository`: saved analysis list/load/delete flow backed by `/api/save-analysis`, `/api/get-analyses`, and `/api/delete-analysis`.

## `netlify/functions/analyze.js` Schema

### Request

`analyze.js` exports `handler(event)` and supports:

| Method | Behavior |
| --- | --- |
| `OPTIONS` | Returns `200` with CORS headers and empty body. |
| `POST` | Parses and processes JSON payload. |
| Any other method | Returns `405` with `{ "error": "Method not allowed" }`. |

### CORS and Headers

Every response includes:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
}
```

### Input JSON

```json
{
  "frames": ["base64_jpeg_string"],
  "metadata": {
    "brand": "string",
    "client": "string",
    "campaign": "string",
    "agency": "string",
    "type": "video|string",
    "industry": "string",
    "audience": "string",
    "market": "India|string",
    "notes": "string",
    "isImage": false,
    "duration_seconds": 30,
    "video_duration": 30,
    "duration": 30,
    "width": 320,
    "height": 180
  }
}
```

Required:

- `frames`: non-empty array of base64 JPEG strings.

Optional:

- `metadata`: defaults to `{}`.
- `metadata.isImage`: defaults to `false`.
- `metadata.duration_seconds`, `metadata.video_duration`, `metadata.duration`: first available value is used; fallback is `30`.
- Brand/client/campaign/agency/type/industry/audience/market/notes are used in prompts and may fall back to `"Unknown"`, `"Not specified"`, `"India"`, or `"video"`.

### Anthropic Request

`analyze.js` sends:

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 6000,
  "system": "system prompt containing full output schema",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "base64_jpeg_string"
          }
        },
        {
          "type": "text",
          "text": "Analyze these frames..."
        }
      ]
    }
  ]
}
```

It calls `https://api.anthropic.com/v1/messages` with `ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`, and a 22-second abort timeout.

### Success Response

```json
{
  "success": true,
  "analysis": {
    "headline_verdict": "string",
    "overall_grade": "A+|A|A-|B+|B|B-|C+|C|C-|D|F",
    "grade_note": "string",
    "creative_summary": "string",
    "viral_potential": 0,
    "hook_strength": 0,
    "hold_rate": 0,
    "emotional_peak": 0,
    "brand_recall": 0,
    "memory_encoding": 0,
    "sound_off_survival": 0,
    "share_intent": 0,
    "creative_efficiency": 0,
    "ad_fatigue_risk": 0,
    "cultural_resonance": 0,
    "celebrity_talent_index": 0,
    "brand_safety": 0,
    "regulatory_compliance": 0,
    "first_party_data_opportunity": 0,
    "carbon_signal": 0,
    "system1_vs_system2": 0,
    "attention_curve": [0],
    "emotion_curve": [0],
    "emotion_types": {
      "joy": [0],
      "surprise": [0],
      "trust": [0],
      "fear": [0],
      "desire": [0],
      "curiosity": [0]
    },
    "brain_regions": {
      "visual_cortex": 0,
      "prefrontal_cortex": 0,
      "amygdala": 0,
      "hippocampus": 0,
      "auditory_cortex": 0,
      "mirror_neurons": 0,
      "nucleus_accumbens": 0,
      "anterior_cingulate": 0
    },
    "cognitive_channels": {
      "visual": 0,
      "auditory": 0,
      "motion": 0,
      "text_overlay": 0,
      "brand_elements": 0,
      "human_faces": 0,
      "color_saturation": 0
    },
    "platform_scores": {
      "youtube_preroll_6s": 0,
      "youtube_preroll_15s": 0,
      "youtube_instream": 0,
      "instagram_reels": 0,
      "instagram_stories": 0,
      "instagram_feed": 0,
      "meta_feed": 0,
      "meta_stories": 0,
      "tiktok": 0,
      "linkedin_feed": 0,
      "twitter_x": 0,
      "tv_broadcast": 0,
      "ctv_ott": 0,
      "dooh": 0,
      "programmatic_display": 0
    },
    "scenes": [
      {
        "ts": "0:00-0:06",
        "name": "string",
        "desc": "string",
        "attention": 0,
        "emotion": 0,
        "system_mode": "system1|system2|mixed",
        "cognitive_load": "low|medium|high|overload",
        "risk_flag": "none|drop_zone|ad_avoidance|cognitive_overload|pacing_issue",
        "badges": ["string"]
      }
    ],
    "strategic_insights": [
      {
        "num": "01",
        "title": "string",
        "body": "string",
        "verdict": "string",
        "vtype": "risk|win|tip|watch"
      }
    ],
    "cmo_actions": [
      {
        "num": "01",
        "title": "string",
        "body": "string",
        "priority": "critical|high|medium|low",
        "impact": "string",
        "effort": "easy|medium|hard"
      }
    ],
    "competitive_context": {
      "category_avg_viral": 0,
      "category_avg_hook": 0,
      "category_avg_hold": 0,
      "category_avg_recall": 0,
      "position": "above_average|average|below_average|category_leader",
      "benchmark_note": "string"
    },
    "sound_analysis": {
      "sound_dependency": 0,
      "music_effectiveness": 0,
      "voiceover_clarity": 0,
      "sound_off_text_quality": 0,
      "asmr_trigger": 0,
      "sonic_branding": 0,
      "sound_note": "string"
    },
    "privacy_and_data_audit": {
      "data_collection_present": false,
      "consent_mechanism_visible": false,
      "qr_code_present": false,
      "url_cta_present": false,
      "hashtag_present": false,
      "regulatory_disclaimers_visible": false,
      "dpdp_compliance_risk": "low|medium|high",
      "privacy_note": "string"
    }
  },
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

Notes:

- All `INT` values in the prompt are expected to be integers from `0` to `100`.
- `attention_curve` is instructed to have one integer per second of video duration.
- `emotion_curve` is duplicated in the prompt: one duration-based instruction and one fixed 10-value example. The function does not normalize this; it returns whatever valid JSON Anthropic provides.

### Error Responses

| Status | Body | Trigger |
| ---: | --- | --- |
| `400` | `{ "error": "No frames provided." }` | Missing or empty `frames`. |
| `405` | `{ "error": "Method not allowed" }` | HTTP method other than `POST` or `OPTIONS`. |
| `500` | `{ "error": "ANTHROPIC_API_KEY not set." }` | Missing server environment variable. |
| `500` | `{ "error": "JSON parse failed", "raw": "..." }` | Anthropic response is not valid JSON after fence cleanup. |
| `500` | `{ "error": "message" }` | Other runtime error. |
| `504` | `{ "error": "Analysis timed out. Try a shorter video or fewer frames." }` | Anthropic request aborts after 22 seconds. |
| Anthropic status | `{ "error": "Anthropic API error: <status>", "details": "..." }` | Upstream Anthropic response is not OK. |

## Environment Variables

See `.env.example` for the current environment contract.
