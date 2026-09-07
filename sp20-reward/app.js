try {
const DATA = JSON.parse(document.getElementById("payload").textContent);
const LABELS = {rewind:"ReWiND", sarm:"SARM", tarm:"TARM-SARM", tarm_rewindbased:"TARM-ReWiND"};
const MODE_COLOR = {success:"#2ec47e", partial:"#e6b84d"};

function statBox(title, value, note) {
  return `<div class="stat"><b>${value}</b><span>${title}<br>${note}</span></div>`;
}
document.getElementById("stats").innerHTML = DATA.methods.map(m => {
  const row = DATA.macro[m];
  return statBox(LABELS[m], (row.pair*100).toFixed(0)+"% S>P",
    `${row.ranked_n}/${row.n_tasks} tasks with S>P`);
}).join("");

function path(xs, ys, w, h, pad) {
  const n = xs.length;
  return xs.map((x,i) => {
    const px = pad + (w-2*pad) * (n===1?0:i/(n-1));
    const py = h-pad - (h-2*pad) * ys[i];
    return `${i?"L":"M"}${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(" ");
}
function chart(model, block) {
  const w=360, h=150, pad=16;
  let paths = "";
  const showClips = document.getElementById("clips").checked;
  for (const mode of DATA.modes) {
    const item = block.modes[mode];
    if (!item) continue;
    if (showClips) {
      for (const clip of item.clips) {
        paths += `<path d="${path(clip, clip, w, h, pad)}" fill="none" stroke="${MODE_COLOR[mode]}" stroke-opacity=".18" stroke-width="1"/>`;
      }
    }
    paths += `<path d="${path(item.mean, item.mean, w, h, pad)}" fill="none" stroke="${MODE_COLOR[mode]}" stroke-width="2.2"/>`;
  }
  const ticks = [0,0.5,1].map(y => {
    const py = h-pad - (h-2*pad)*y;
    return `<line x1="${pad}" x2="${w-pad}" y1="${py}" y2="${py}" stroke="#2a3140"/><text x="4" y="${py+3}" fill="#8b95a5" font-size="9">${y}</text>`;
  }).join("");
  const nums = DATA.modes.map(mode => {
    const item = block.modes[mode];
    if (!item) return "";
    return `<span class="nums"><span class="dot ${mode}"></span>${mode} <b>${item.tail_mean.toFixed(3)}</b></span>`;
  }).join(" ");
  const pill = block.ranked ? '<span class="pill ok">S&gt;P</span>' :
    '<span class="pill bad">order broken</span>';
  return `<div class="chart"><h3>${LABELS[model]} · S&gt;P ${(block.pair*100).toFixed(0)}% ${pill}</h3>
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${ticks}${paths}</svg>
    <div class="legend">${nums}</div></div>`;
}

function gifs(task) {
  if (!document.getElementById("gifs").checked || !task.gifs) return "";
  return `<div class="gifs">${DATA.modes.map(mode => {
    const rel = (DATA.gif_prefix || "") + (task.gifs[mode] || "");
    if (!task.gifs[mode]) return "";
    return `<figure><img src="${rel}" alt="${task.id} ${mode}"><figcaption>${mode}</figcaption></figure>`;
  }).join("")}</div>`;
}

function rankedCount(task) {
  return DATA.methods.filter(m => task.models[m].ranked).length;
}

function render() {
  const sort = document.getElementById("sort").value;
  const tasks = DATA.tasks.slice().sort((a,b) => {
    if (sort === "tarm") return (b.models.tarm.pair||0) - (a.models.tarm.pair||0) || a.id.localeCompare(b.id);
    if (sort === "tarm_rewindbased") return (b.models.tarm_rewindbased.pair||0) - (a.models.tarm_rewindbased.pair||0) || a.id.localeCompare(b.id);
    if (sort === "ranked") return rankedCount(b) - rankedCount(a) || a.id.localeCompare(b.id);
    return a.id.localeCompare(b.id);
  });
  document.getElementById("grid").innerHTML = tasks.map(task => {
    const pills = DATA.methods.map(m => {
      const ok = task.models[m].ranked;
      return `<span class="pill ${ok?"ok":"bad"}">${LABELS[m]} ${(task.models[m].pair*100).toFixed(0)}%</span>`;
    }).join("");
    return `<article class="task" id="t${task.id}">
      <h2>Task ${task.id} <span class="pills">${pills}</span></h2>
      ${gifs(task)}
      <div class="charts">${DATA.methods.map(m => chart(m, task.models[m])).join("")}</div>
    </article>`;
  }).join("");
}
document.getElementById("sort").onchange = render;
document.getElementById("gifs").onchange = render;
document.getElementById("clips").onchange = render;
render();

} catch (err) {
  var g = document.getElementById("grid") || document.body;
  g.innerHTML = "<p style=\"color:#e06b6b;padding:20px\">Reward page failed: " +
    String(err) + "</p>";
  console.error(err);
}
