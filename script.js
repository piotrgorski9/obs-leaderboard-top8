
const URL = "https://docs.google.com/spreadsheets/d/19f4j9DMwQuuLgeGhvuLVhvM0N6mVZiiXoJyuk4tO8l8/gviz/tq?tqx=out:json";

let lastHash = "";
let gameStopped = false;
let interval = 1200;

/* =========================
   AVATARS (FOLDER SYSTEM)
========================= */
function getAvatar(path) {
    if (!path) return "avatars/default.png";
    return `avatars/${path}`;
}

/* =========================
   HASH
========================= */
function hash(players) {
    return players.map(p => `${p.name}:${p.points}:${p.isWin}`).join("|");
}

/* =========================
   LOAD DATA
========================= */
async function loadData() {

    if (gameStopped) return;

    const res = await fetch(URL + "&t=" + Date.now());
    const text = await res.text();

    const json = JSON.parse(
        text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)
    );

    let players = json.table.rows.map(r => {

        const name = r.c[0]?.v || "";
        const points = Number(r.c[1]?.v) || 0;
        const avatar = getAvatar(r.c[2]?.v);
        const status = String(r.c[3]?.v || "").trim().toUpperCase();

        return {
            name,
            points,
            avatar,
            isWin: status === "WIN"
        };

    }).filter(p => p.name);

    players.sort((a, b) => {
        if (a.isWin && !b.isWin) return -1;
        if (!a.isWin && b.isWin) return 1;
        return b.points - a.points;
    });

    players.forEach((p, i) => p.rank = i + 1);

    const newHash = hash(players);

    if (newHash === lastHash) {
        scheduleNext(false);
        return;
    }

    lastHash = newHash;

    if (players.some(p => p.isWin)) {
        gameStopped = true;
    }

    render(players);
    update(players);

    scheduleNext(true);
}

/* =========================
   SCHEDULER
========================= */
function scheduleNext(changed) {
    clearTimeout(window._t);

    interval = changed ? 800 : Math.min(interval + 200, 2500);

    window._t = setTimeout(loadData, interval);
}

/* =========================
   RENDER
========================= */
function render(players) {

    const col1 = document.getElementById("col1");
    const col2 = document.getElementById("col2");

    const html = players.map(p => `
        <div class="player ${p.isWin ? 'win' : ''}" data-name="${p.name}">
          
          <div class="left">
            <img class="avatar" src="${p.avatar}" onerror="this.src='avatars/default.png'">
            <span class="rank">#${p.rank}</span>
            <span class="name">${p.name}</span>
          </div>

          <div class="points">
            ${p.isWin ? '🏆 WIN' : (p.points >= 20 ? `👑 ${p.points}` : p.points)}
          </div>

        </div>
    `);

    col1.innerHTML = html.slice(0, 4).join("");
    col2.innerHTML = html.slice(4, 8).join("");
}

/* =========================
   UPDATE ONLY VALUES
========================= */
function update(players) {

    players.forEach(p => {
        const el = document.querySelector(`[data-name="${p.name}"]`);
        if (!el) return;

        const pointsEl = el.querySelector(".points");

        if (p.isWin) {
            el.classList.add("win");
            pointsEl.innerHTML = "🏆 WIN";
            return;
        }

        const is20 = p.points >= 20;

        el.classList.toggle("achieved20", is20);
        pointsEl.innerHTML = is20 ? `👑 ${p.points}` : p.points;
    });
}

/* =========================
   START
========================= */
loadData();