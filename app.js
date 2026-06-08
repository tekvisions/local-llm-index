/* The Local LLM Index — client. Fetch data.json, render spec-sheet cards, wire search/filter/sort. */
(function () {
  "use strict";
  var DATA = { items: [], categories: [], count: 0, generated_at: null };
  var state = { q: "", cat: "all", sort: "momentum" };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, function (m) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]; }); }
  function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n); }
  function ago(iso) {
    if (!iso) return "—";
    var d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return "today"; if (d < 30) return Math.round(d) + "d ago";
    if (d < 365) return Math.round(d / 30) + "mo ago"; return Math.round(d / 365) + "y ago";
  }

  var saved = null;
  try { saved = localStorage.getItem("ll-theme"); } catch (e) {}
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  $("#theme").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", cur);
    try { localStorage.setItem("ll-theme", cur); } catch (e) {}
  });

  function countUp(el, target) {
    var dur = 900, t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function matches(it) {
    if (state.cat !== "all" && it.category !== state.cat) return false;
    if (!state.q) return true;
    return (it.full_name + " " + it.description + " " + (it.topics || []).join(" ") + " " + it.category)
      .toLowerCase().indexOf(state.q.toLowerCase()) !== -1;
  }
  function sortItems(list) {
    var s = state.sort;
    return list.slice().sort(function (a, b) {
      if (s === "stars") return b.stars - a.stars;
      if (s === "new") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return b.momentum - a.momentum || b.stars - a.stars;
    });
  }

  function card(it, i) {
    function spec(k, v) { return '<div><span class="k">' + k + '</span><span class="v">' + v + "</span></div>"; }
    var rows = spec("stars", "★ " + fmt(it.stars)) + spec("forks", fmt(it.forks)) +
      (it.language ? spec("lang", esc(it.language)) : "") +
      (it.license ? spec("license", esc(it.license)) : "") + spec("updated", ago(it.pushed_at));
    return (
      '<a class="card" href="/p/' + esc(it.slug) + '/" style="transition-delay:' + (i % 12) * 32 + 'ms">' +
        '<div class="card-head"><span class="cat">' + esc(it.category) + '</span>' +
          '<span class="rk">#' + it.rank + "</span></div>" +
        '<div class="card-body">' +
          '<div class="name disp">' + esc(it.name) + "</div>" +
          '<div class="owner">' + esc(it.owner) + "</div>" +
          '<div class="desc">' + esc(it.description || "No description.") + "</div>" +
          '<div class="spec">' + rows + "</div>" +
          '<div class="gauge"><span class="k" style="font-size:10px;color:var(--faint);text-transform:uppercase">mom</span>' +
            '<div class="bar"><i data-w="' + it.momentum + '"></i></div>' +
            '<span class="score disp">' + it.momentum + "</span></div>" +
        "</div>" +
      "</a>"
    );
  }

  function render() {
    var list = sortItems(DATA.items.filter(matches)), grid = $("#grid");
    $("#metaline").textContent = list.length + (list.length === 1 ? " tool" : " tools") +
      (state.cat === "all" ? "" : " · " + state.cat) + (state.q ? ' · "' + state.q + '"' : "");
    if (!list.length) { grid.innerHTML = '<div class="empty">No tools match. Try a broader search.</div>'; return; }
    grid.innerHTML = list.map(card).join("");
    var cards = grid.querySelectorAll(".card");
    requestAnimationFrame(function () {
      cards.forEach(function (c) { c.classList.add("in"); });
      grid.querySelectorAll(".gauge .bar i").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
    });
  }

  function chips() {
    var box = $("#chips"), html = ['<button class="chip active" data-cat="all">All <span class="ct">' + DATA.count + "</span></button>"];
    DATA.categories.forEach(function (c) {
      html.push('<button class="chip" data-cat="' + esc(c.name) + '">' + esc(c.name) + ' <span class="ct">' + c.count + "</span></button>");
    });
    box.innerHTML = html.join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      box.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active"); state.cat = b.getAttribute("data-cat"); render();
    });
  }

  function boot() {
    countUp($("#s-count"), DATA.count);
    countUp($("#s-cats"), DATA.categories.length);
    $("#s-top").textContent = DATA.items.length ? DATA.items[0].momentum : "—";
    if (DATA.generated_at) $("#foot-updated").textContent = "Last recomputed " + new Date(DATA.generated_at).toUTCString().replace("GMT", "UTC");
    chips(); render();
    var qi = $("#q"), t;
    qi.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { state.q = qi.value.trim(); render(); }, 120); });
    $("#sort").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $("#sort").querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active"); state.sort = b.getAttribute("data-sort"); render();
    });
  }

  fetch("/data.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (d) { DATA = d; boot(); })
    .catch(function () { $("#metaline").textContent = "Could not load the index. Refresh to retry."; });
})();
