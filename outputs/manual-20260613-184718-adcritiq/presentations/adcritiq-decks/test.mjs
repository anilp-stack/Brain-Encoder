import { ensureArtifactToolWorkspace, importArtifactTool } from '/Users/anipandi/.codex/plugins/cache/openai-primary-runtime/presentations/26.601.10930/skills/presentations/scripts/artifact_tool_utils.mjs';
const workspace='/Users/anipandi/Documents/Brain Encoder/outputs/manual-20260613-184718-adcritiq/presentations/adcritiq-decks';
await ensureArtifactToolWorkspace(workspace);
const art=await importArtifactTool(workspace);
console.log(Object.keys(art).slice(0,30));
const {Presentation, PresentationFile}=art;
const p=Presentation.create({slideSize:{width:1280,height:720}});
const s=p.slides.add();
console.log('slide', p.slides.count, Object.keys(s).slice(0,20));
