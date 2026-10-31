import { createApp } from "blazefw";
import { page } from "./page";

type Env = { AI: Ai };
const app = createApp<Env>();
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";

// The test page. Open port 8787 from the Ports tab to see it.
app.get("/", (req, res) => res.html(page));

// Step 2 · an agent is one model call with a role
async function agent(env: Env, role: string, input: string) {
  const out = await env.AI.run(MODEL, { messages: [
    { role: "system", content: role },
    { role: "user", content: input } ] });
  return (out as { response: string }).response.trim();
}

// Step 3 · a strategist sets the angle; one writer per platform
const strategist = "You are a social media strategist. In one " +
  "sentence, say who this update is for and the one point " +
  "every post must make.";
const writers = {
  linkedin: "You write LinkedIn posts: 3 short paragraphs, " +
    "end with a question. Reply with the post only.",
  x: "You write posts for X: under 280 characters, " +
    "at most 2 hashtags. Reply with the post only.",
  instagram: "You write Instagram captions: a hook line, " +
    "2 short lines, 5 hashtags. Reply with the caption only.",
};
type Platform = keyof typeof writers;

// Step 4 · a brand-voice critic checks every post
const critic = "Reply with the one word OK if the post is on " +
  "topic, has no hype words (game-changing, revolutionary) " +
  "and adds no facts beyond the update. If not, say what to fix.";

async function write(env: Env, platform: Platform, task: string) {
  let post = await agent(env, writers[platform], task);
  const notes: string[] = [];
  for (let round = 1; round <= 2; round++) {
    const verdict = platform === "x" && post.length > 280 // no AI
      ? `Too long: ${post.length} characters. Cut to 280.`
      : await agent(env, critic, `${task}\nPost: ${post}`);
    notes.push(verdict);
    if (verdict.toUpperCase().startsWith("OK")) {
      return { platform, post, rounds: round, notes };
    }
    post = await agent(env, writers[platform],
      `${task}\nYour draft: ${post}\nFix this: ${verdict}`);
  }
  return { platform, post, notes, note: "needs a human" };
}

// Step 3 · the orchestrator: brief first, then 3 writers at once
app.post("/posts", async (req, res) => {
  const { update } = await req.json<{ update: string }>();
  const brief = await agent(req.env, strategist, update);
  const task = `Update: ${update}\nBrief: ${brief}`;
  const platforms = Object.keys(writers) as Platform[];
  const posts = await Promise.all(
    platforms.map((platform) => write(req.env, platform, task)));
  res.json({ brief, posts });
});

export default { fetch: app.fetch };
