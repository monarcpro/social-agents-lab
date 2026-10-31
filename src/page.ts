// The test page served at GET /. You don't need to edit this file in the lab.
export const page = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Social agents · test page</title>
<style>
  :root { --ink:#10110F; --card:#1E1F1B; --line:#2D2E2A; --bone:#EDEAE2; --muted:#A6A49B; --amber:#E8A33D; --ok:#7C9A72; --bad:#D0663F; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--ink); color:var(--bone); font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width:1100px; margin:0 auto; padding:32px 16px 64px; }
  h1 { font-size:28px; margin:0 0 4px; }
  .sub { color:var(--muted); margin:0 0 24px; }
  textarea { width:100%; min-height:88px; padding:14px; border-radius:10px; border:1px solid var(--line); background:var(--card); color:var(--bone); font:inherit; resize:vertical; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:12px 0 24px; }
  button { font:inherit; border-radius:999px; border:1px solid var(--line); background:var(--card); color:var(--bone); padding:8px 14px; cursor:pointer; }
  button.go { background:var(--amber); border-color:var(--amber); color:var(--ink); font-weight:600; padding:10px 20px; }
  button:disabled { opacity:.5; cursor:wait; }
  .status { color:var(--muted); }
  .brief { border-left:3px solid var(--amber); padding:8px 14px; margin:0 0 20px; background:var(--card); border-radius:0 10px 10px 0; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:18px; display:flex; flex-direction:column; gap:10px; }
  .card h2 { font-size:18px; margin:0; display:flex; justify-content:space-between; gap:8px; }
  .count { color:var(--muted); font-weight:400; font-size:14px; }
  .count.over { color:var(--bad); }
  .post { white-space:pre-wrap; margin:0; }
  .badge { align-self:flex-start; font-size:13px; padding:3px 10px; border-radius:999px; border:1px solid var(--line); color:var(--muted); }
  .badge.ok { color:var(--ok); border-color:var(--ok); }
  .badge.human { color:var(--bad); border-color:var(--bad); }
  ol.notes { margin:0; padding-left:20px; color:var(--muted); font-size:14px; }
  .error { color:var(--bad); white-space:pre-wrap; }
  details { margin-top:24px; color:var(--muted); }
  pre.raw { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px; overflow:auto; font-size:13px; }
</style>
</head>
<body>
<main>
  <h1>Social agents</h1>
  <p class="sub">Type a product update. Your agents write one post each for LinkedIn, X and Instagram.</p>
  <textarea id="update">We just launched dark mode</textarea>
  <div class="row">
    <button class="go" id="go">Write posts</button>
    <span class="sub" style="margin:0">or try:</span>
    <button data-try>We just launched dark mode</button>
    <button data-try>Our café now opens at 7am on weekends</button>
    <button data-try>Free workshop: build your first AI agent, Saturday 10am</button>
  </div>
  <p class="status" id="status"></p>
  <div id="out"></div>
  <details><summary>Raw JSON from POST /posts</summary><pre class="raw" id="raw"></pre></details>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const names = { linkedin: "LinkedIn", x: "X", instagram: "Instagram" };

  document.querySelectorAll("[data-try]").forEach((b) => b.onclick = () => { $("update").value = b.textContent; run(); });
  $("go").onclick = run;

  async function run() {
    const update = $("update").value.trim();
    if (!update) { $("status").textContent = "Type an update first."; return; }
    const started = Date.now();
    const show = () => { $("status").textContent = "Agents are working… " + Math.round((Date.now() - started) / 1000) + " s"; };
    show();
    const tick = setInterval(show, 250);
    document.querySelectorAll("button").forEach((b) => b.disabled = true);
    $("out").replaceChildren();
    try {
      const r = await fetch("/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ update }) });
      const text = await r.text();
      $("raw").textContent = text;
      if (!r.ok) throw new Error("POST /posts answered " + r.status + "\\n" + text);
      render(JSON.parse(text));
      $("status").textContent = "Done in " + ((Date.now() - started) / 1000).toFixed(1) + " s";
    } catch (e) {
      $("status").replaceChildren(el("span", "error", String(e.message || e)));
    } finally {
      clearInterval(tick);
      document.querySelectorAll("button").forEach((b) => b.disabled = false);
    }
  }

  function render(data) {
    const out = $("out");
    if (data.brief) { const b = el("p", "brief"); b.append(el("b", null, "Brief: "), data.brief); out.append(b); }
    const grid = el("div", "grid");
    for (const p of data.posts || []) {
      const card = el("div", "card");
      const h = el("h2", null, names[p.platform] || p.platform);
      const n = (p.post || "").length;
      h.append(el("span", "count" + (p.platform === "x" && n > 280 ? " over" : ""), n + (p.platform === "x" ? " / 280" : "") + " chars"));
      card.append(h, el("p", "post", p.post));
      if (p.note) card.append(el("span", "badge human", "Critic: " + p.note));
      else if (p.rounds) card.append(el("span", "badge ok", "Critic: OK in round " + p.rounds));
      if (p.notes && p.notes.length) {
        const ol = el("ol", "notes");
        p.notes.forEach((note, i) => ol.append(el("li", null, "Round " + (i + 1) + ": " + note)));
        card.append(ol);
      }
      grid.append(card);
    }
    out.append(grid);
  }
</script>
</body>
</html>`;
