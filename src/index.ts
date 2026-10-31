import { createApp } from "blazefw";
import { page } from "./page";

type Env = { AI: Ai };
const app = createApp<Env>();

// The test page. Open port 8787 from the Ports tab to see it.
app.get("/", (req, res) => res.html(page));

// Step 1 · a stub with fake posts, so the page works before AI
app.post("/posts", async (req, res) => {
  const { update } = await req.json<{ update: string }>();
  const posts = ["linkedin", "x", "instagram"].map((platform) =>
    ({ platform, post: `[${platform} post about: ${update}]` }));
  res.json({ brief: "Step 1 stub: no agents yet", posts });
});

// Steps 2 to 4 add code above this line. Keep it last.
export default { fetch: app.fetch };
