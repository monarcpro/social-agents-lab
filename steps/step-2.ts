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

// Step 2 · one agent writes one post (step 3 replaces this route)
app.post("/posts", async (req, res) => {
  const { update } = await req.json<{ update: string }>();
  const post = await agent(req.env, "You write LinkedIn posts: " +
    "3 short paragraphs, end with a question.", update);
  res.json({ posts: [{ platform: "linkedin", post }] });
});

export default { fetch: app.fetch };
