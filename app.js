import { load, save } from "./db.js";
import {
  dayKey,
  parseDay,
  diff,
  birthday,
  nextBirthday,
  countdown,
} from "./dates.js";
const $ = (s) => document.querySelector(s),
  app = $("#app"),
  modal = $("#modal");
const defaults = () => ({
  version: 1,
  people: [],
  festivities: [],
  settings: {
    week: true,
    day: true,
    today: true,
    party: true,
    gifts: true,
    theme: "auto",
    upcoming: "30",
    upcomingParties: "30",
    upcomingFestivities: "30",
  },
});
let state,
  page = "home",
  now = new Date(),
  month = new Date(now.getFullYear(), now.getMonth(), 1),
  selected = null,
  search = "";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (d, opts = { day: "numeric", month: "long" }) =>
  d.toLocaleDateString("en-GB", opts);
const plan = (p, y) => p.plans?.[y] || {};
const age = (p, y) => (p.year && y >= p.year ? `Turning ${y - p.year}` : "");
const gift = (g) =>
  g.wrapped
    ? "Gift wrapped"
    : g.bought
      ? "Gift purchased"
      : g.gift
        ? `Gift idea: ${g.gift}`
        : "Gift not purchased";
const title = (name, sub = "") =>
  `<div class="row between"><div class="grow"><small>${esc(sub)}</small><h1>${name}</h1></div><button class="primary" data-add>＋ Add</button></div>`;
async function persist() {
  try {
    await save(state);
  } catch (e) {
    alert(
      "Could not save your data. Export a backup immediately. " + e.message,
    );
    throw e;
  }
}
function entry(p, d, type = "birthday", year = d.getFullYear()) {
  const g = plan(p, year);
  return `<button class="entry row" data-person="${esc(p.id)}" data-year="${year}"><span class="datebox"><small>${fmt(d, { month: "short" })}</small><b>${d.getDate()}</b></span><span class="grow"><b>${esc(p.name)}${type === "party" ? " · party" : ""}</b><br><small>${esc(type === "party" ? [g.time, g.location].filter(Boolean).join(" · ") || "Birthday party" : [age(p, year), gift(g)].filter(Boolean).join(" · "))}</small></span><span class="pill">${countdown(diff(d, now))}</span></button>`;
}
function events(y, m) {
  const out = [];
  for (const p of state.people) {
    const d = birthday(p, y);
    if (d.getMonth() === m) out.push({ p, d, type: "birthday", year: y });
    for (const [year, g] of Object.entries(p.plans || {})) {
      if (g.party) {
        const d = parseDay(g.party);
        if (d.getFullYear() === y && d.getMonth() === m)
          out.push({ p, d, type: "party", year: Number(year) });
      }
    }
  }
  for (const f of state.festivities) {
    const d = parseDay(f.date);
    if (d.getFullYear() === y && d.getMonth() === m)
      out.push({ f, d, type: "festivity" });
  }
  return out.sort(
    (a, b) =>
      a.d - b.d || (a.p?.name || a.f.name).localeCompare(b.p?.name || b.f.name),
  );
}
const rows = (arr) =>
  arr.length
    ? arr
        .map((e) => (e.f ? festEntry(e.f) : entry(e.p, e.d, e.type, e.year)))
        .join("")
    : '<p class="empty">No events.</p>';
const upcomingSections = [
  ["upcoming", "birthdays"],
  ["upcomingParties", "parties"],
  ["upcomingFestivities", "festivities"],
];
const upcomingValues = ["5", "10", "30"];

function upcomingOptions(name) {
  return [
    ["5", `Next 5 ${name}`],
    ["10", `Next 10 ${name}`],
    ["30", "Next 30 days"],
  ];
}

function upcomingList(arr, setting = "upcoming") {
  const v = state.settings[setting];
  const upcoming = arr
    .filter((e) => diff(e.d, now) >= 0)
    .sort((a, b) => a.d - b.d);

  if (v === "5" || v === "10") return upcoming.slice(0, Number(v));
  return upcoming.filter((e) => diff(e.d, now) <= 30);
}
const festProgress = (f) =>
  `${f.recipients.filter((r) => r.bought || r.wrapped).length}/${f.recipients.length} gifts purchased`;
function festEntry(f) {
  const d = parseDay(f.date);
  return `<button class="entry row" data-fest="${esc(f.id)}"><span class="datebox"><small>${fmt(d, { month: "short" })}</small><b>${d.getDate()}</b></span><span class="grow"><b>${esc(f.name)} · Festivity</b><br><small>${esc(festProgress(f))} · ${d.getFullYear()}</small></span><span class="pill">${countdown(diff(d, now))}</span></button>`;
}
function festRows(fs) {
  return fs.length
    ? [...fs]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(festEntry)
        .join("")
    : '<p class="empty">No festivities.</p>';
}
function festivities() {
  return (
    title("Festivities", "Custom events and gifts") +
    `<h2>Upcoming</h2>` +
    festRows(
      state.festivities.filter((f) => diff(parseDay(f.date), now) >= 0),
    ) +
    `<h2>Past festivities</h2>` +
    festRows(state.festivities.filter((f) => diff(parseDay(f.date), now) < 0))
  );
}
function editFest(f) {
  const isNew = !f;
  f = f || {
    id: crypto.randomUUID(),
    name: "",
    date: dayKey(now),
    location: "",
    notes: "",
    recipients: [],
  };
  modal.innerHTML = `<form id="festForm"><h1>${isNew ? "Add festivity" : "Edit festivity"}</h1><label>Event name<input name="name" required maxlength="120" value="${esc(f.name)}" placeholder="Friends Christmas"></label><label>Date<input name="date" type="date" required value="${esc(f.date)}"></label><label>Location<input name="location" value="${esc(f.location)}"></label><label>Notes<textarea name="notes">${esc(f.notes)}</textarea></label><h2>People and gifts</h2><datalist id="festPeople">${state.people.map((p) => `<option value="${esc(p.name)}"></option>`).join("")}</datalist><div id="recipients"></div><button type="button" id="addRecipient">＋ Add person</button><div class="actions"><button type="button" data-close>Cancel</button><button class="primary">Save festivity</button></div></form>${isNew ? "" : `<hr><button class="danger" data-del-fest="${esc(f.id)}">Delete festivity</button>`}`;
  const add = (r) => {
    const el = document.createElement("div");
    el.className = "card recipient";
    el.innerHTML = `<label>Name<input name="recipientName" list="festPeople" required value="${esc(r.name)}"></label><label>Gift idea / description<textarea name="recipientGift">${esc(r.gift)}</textarea></label><label class="check"><input type="checkbox" name="recipientBought" ${r.bought ? "checked" : ""}>Gift purchased</label><label class="check"><input type="checkbox" name="recipientWrapped" ${r.wrapped ? "checked" : ""}>Gift wrapped</label><button type="button" class="danger removeRecipient">Remove person</button>`;
    el.querySelector(".removeRecipient").onclick = () => el.remove();
    $("#recipients").append(el);
  };
  f.recipients.forEach(add);
  $("#addRecipient").onclick = () => add({});
  if (!modal.open) modal.showModal();
  $("#festForm").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target,
      fields = new FormData(form);
    const name = fields.get("name").trim();
    if (!name) {
      alert("Enter an event name.");
      return;
    }
    const recipients = [...form.querySelectorAll(".recipient")].map((el) => {
      const get = (n) => el.querySelector(`[name="${n}"]`);
      return {
        name: get("recipientName").value.trim(),
        gift: get("recipientGift").value,
        bought:
          get("recipientBought").checked || get("recipientWrapped").checked,
        wrapped: get("recipientWrapped").checked,
      };
    });
    if (recipients.some((r) => !r.name)) {
      alert("Enter a name for every recipient.");
      return;
    }
    const updated = {
      ...f,
      name,
      date: fields.get("date"),
      location: fields.get("location"),
      notes: fields.get("notes"),
      recipients,
    };
    if (isNew) state.festivities.push(updated);
    else
      state.festivities = state.festivities.map((x) =>
        x.id === f.id ? updated : x,
      );
    await persist();
    modal.close();
    render();
  };
}

function home() {
  const upcoming = state.people
    .map((p) => ({ p, d: nextBirthday(p, now) }))
    .sort((a, b) => a.d - b.d);
  const first = upcoming[0];
  let alerts = [];
  for (const { p, d } of upcoming) {
    const n = diff(d, now),
      g = plan(p, d.getFullYear()),
      s = state.settings;
    if (
      (n === 0 && s.today) ||
      (n === 1 && s.day) ||
      (n >= 2 && n <= 7 && s.week)
    ) {
      alerts.push({
        p,
        d,
        n,
        type: "birthday",
        year: d.getFullYear(),
        msg: `${p.name} · Birthday · ${countdown(n)}`,
        detail: s.gifts ? gift(g) : age(p, d.getFullYear()),
      });
    }
    for (const [y, g] of Object.entries(p.plans || {})) {
      if (!g.party || !s.party) continue;
      const d = parseDay(g.party),
        n = diff(d, now);
      if (n >= 0 && n <= 7)
        alerts.push({
          p,
          d,
          n,
          type: "party",
          year: y,
          msg: `${p.name} · Party · ${countdown(n)}`,
          detail: s.gifts ? gift(g) : g.location,
        });
    }
  }
  for (const f of state.festivities) {
    const d = parseDay(f.date),
      n = diff(d, now),
      s = state.settings;
    if (
      (n === 0 && s.today) ||
      (n === 1 && s.day) ||
      (n >= 2 && n <= 7 && s.week)
    )
      alerts.push({
        f,
        d,
        n,
        type: "festivity",
        msg: `${f.name} · Festivity · ${countdown(n)}`,
        detail: festProgress(f),
      });
  }
  alerts.sort((a, b) => a.n - b.n);
  const upcomingParties = [];
  for (const p of state.people) {
    for (const [year, g] of Object.entries(p.plans || {})) {
      if (!g.party) continue;

      const d = parseDay(g.party);

      if (diff(d, now) >= 0) {
        upcomingParties.push({
          p,
          d,
          type: "party",
          year: Number(year),
        });
      }
    }
  }

  const visibleParties = upcomingList(upcomingParties, "upcomingParties");
  const visibleFestivities = upcomingList(
    state.festivities.map((f) => ({ f, d: parseDay(f.date) })),
    "upcomingFestivities",
  );
  return (
    title(
      "Birthdays",
      fmt(now, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    ) +
    (first
      ? `<button class="card hero" style="width:100%;text-align:left" data-person="${esc(first.p.id)}" data-year="${first.d.getFullYear()}"><small>NEXT BIRTHDAY</small><strong>${esc(first.p.name)}</strong><strong>${countdown(diff(first.d, now))}</strong><p>${fmt(first.d)} · ${esc(gift(plan(first.p, first.d.getFullYear())))}</p></button>`
      : '<div class="card empty">Add your first birthday to get started.</div>') +
    `<h2>Reminders ${alerts.length ? `<span class="pill">${alerts.length}</span>` : ""}</h2>` +
    (alerts.length
      ? alerts
          .map(
            (a) =>
              `<button class="entry row" ${a.f ? `data-fest="${esc(a.f.id)}"` : `data-person="${esc(a.p.id)}" data-year="${a.year}"`}><span>${a.type === "festivity" ? "🎁" : a.type === "party" ? "🎉" : "🎂"}</span><span class="grow"><b>${esc(a.msg)}</b><br><small>${esc(a.detail)}</small></span></button>`,
          )
          .join("")
      : '<p class="muted">Nothing due in your reminder window.</p>') +
    `<h2>Upcoming birthdays</h2>` +
    rows(upcomingList(upcoming)) +
    (visibleParties.length
      ? `<h2>Upcoming parties</h2>` + rows(visibleParties)
      : "") +
    (visibleFestivities.length
      ? `<h2>Upcoming festivities</h2>` + rows(visibleFestivities)
      : "")
  );
}
function calendar() {
  const y = month.getFullYear(),
    m = month.getMonth(),
    ev = events(y, m),
    start = (month.getDay() + 6) % 7,
    days = new Date(y, m + 1, 0).getDate();
  return (
    title("Calendar") +
    `<div class="card"><div class="row between"><button data-shift="-1" aria-label="Previous month">‹</button><b>${fmt(month, { month: "long", year: "numeric" })}</b><button data-shift="1" aria-label="Next month">›</button></div><div class="calendar" style="margin-top:16px">${["M", "T", "W", "T", "F", "S", "S"].map((x) => `<small>${x}</small>`).join("")}${"<span></span>".repeat(start)}${Array.from(
      { length: days },
      (_, i) => {
        const d = i + 1;
        return `<button data-date="${d}" class="${selected === d ? "selected " : ""}${dayKey(new Date(y, m, d)) === dayKey(now) ? "today" : ""}">${d}<span class="dots">${ev
          .filter((e) => e.d.getDate() === d)
          .slice(0, 5)
          .map(
            (e) =>
              `<span class="dot ${e.type === "festivity" ? "festivity" : e.type === "party" ? "party" : ""}"></span>`,
          )
          .join("")}</span></button>`;
      },
    ).join(
      "",
    )}</div><p><small>● Birthday &nbsp; <span style="color:#d58b32">● Party</span> &nbsp; <span style="color:#548bd0">● Festivity</span></small></p><button data-today>Go to today</button> <button data-all>Whole month</button></div><h2>${selected ? fmt(new Date(y, m, selected)) : "Events this month"}</h2>` +
    rows(ev.filter((e) => !selected || e.d.getDate() === selected))
  );
}
function people() {
  return (
    title("People", `${state.people.length} saved birthdays`) +
    `<input id="search" type="search" placeholder="Search people" value="${esc(search)}"><div id="results">${peopleRows()}</div>`
  );
}
function peopleRows() {
  return rows(
    state.people
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ p, d: nextBirthday(p, now) })),
  );
}
function settings() {
  const s = state.settings;

  return `
    <h1>Settings</h1>

    <div class="card">
      <h2>Reminders</h2>

      ${[
        ["week", "Within one week"],
        ["day", "One day before"],
        ["today", "On the birthday"],
        ["party", "Upcoming parties (within 7 days)"],
        ["gifts", "Show gift status in reminders"],
      ]
        .map(
          ([k, l]) => `
            <label class="check">
              <input type="checkbox"
                     data-setting="${k}"
                     ${s[k] ? "checked" : ""}>
              ${l}
            </label>
          `,
        )
        .join("")}

      <small>Reminders appear inside the app only.</small>
    </div>

    <div class="card">
      <h2>Upcoming events</h2>

      ${upcomingSections
        .map(
          ([id, name]) => `
            <label for="${id}">Upcoming ${name}</label>
            <select id="${id}">
              ${upcomingOptions(name)
                .map(
                  ([v, l]) => `
                    <option value="${v}" ${s[id] === v ? "selected" : ""}>
                      ${l}
                    </option>
                  `,
                )
                .join("")}
            </select>
          `,
        )
        .join("")}
    </div>

    <div class="card">
      <label for="theme">Appearance</label>

      <select id="theme">
        ${["auto", "light", "dark"]
          .map(
            (t) => `
              <option ${t === s.theme ? "selected" : ""}>${t}</option>
            `,
          )
          .join("")}
      </select>
    </div>

    <div class="card">
      <h2>Data and backups</h2>

      <p>
        Your records are stored on this device. Export backups
        regularly, especially before clearing browser data,
        removing the app or changing phones.
      </p>

      <div class="actions">
        <button data-export>Export JSON</button>
        <button data-import>Restore JSON</button>
      </div>

      <input hidden type="file" id="import" accept=".json,application/json">

      <p>
        <small>Restoring replaces all existing records.</small>
      </p>
    </div>

    <div class="card">
      <h2>About Birthday Planner</h2>

      <p class="muted">Version 2.1 · Offline-first PWA</p>

      <p class="muted">
        Free, with no accounts, ads or cloud synchronization.
      </p>

      <p class="muted">
        Leap-day birthdays are observed on 28 February
        in non-leap years.
      </p>
    </div>

    <div class="card">
      <h2>Privacy &amp; Analytics</h2>

      <p class="muted">
        Your personal records are stored locally on your
        device and are not uploaded to a server.
      </p>

      <p class="muted">
        Cloudflare Web Analytics collects aggregate usage
        statistics without accessing your saved records
        or using tracking cookies.
      </p>

      <a href="https://www.cloudflare.com/privacypolicy/"
         target="_blank"
         rel="noopener noreferrer">
        Cloudflare Privacy Policy
      </a>
    </div>
  `;
}
function render() {
  now = new Date();
  document.documentElement.dataset.theme = state.settings.theme;
  app.innerHTML = { home, calendar, people, festivities, settings }[page]();
  $("#nav").innerHTML = [
    ["home", "⌂", "Home"],
    ["calendar", "▦", "Calendar"],
    ["people", "♙", "People"],
    ["festivities", "🎁", "Festivities"],
    ["settings", "⚙", "Settings"],
  ]
    .map(
      ([k, i, l]) =>
        `<button data-page="${k}" class="${page === k ? "active" : ""}" ${page === k ? 'aria-current="page"' : ""}><span>${i}</span>${l}</button>`,
    )
    .join("");
}
function editPerson(p) {
  const isNew = !p;
  p = p || {
    name: "",
    day: 1,
    month: 1,
    year: "",
    relationship: "",
    notes: "",
    plans: {},
  };
  modal.innerHTML = `<form id="personForm"><h1>${isNew ? "Add birthday" : "Edit person"}</h1><label>Name<input name="name" required maxlength="120" value="${esc(p.name)}"></label><div class="row"><label class="grow">Day<select name="day">${Array.from({ length: 31 }, (_, i) => `<option ${i + 1 === p.day ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label><label class="grow">Month<select name="month">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === p.month ? "selected" : ""}>${fmt(new Date(2024, i, 1), { month: "long" })}</option>`).join("")}</select></label></div><label>Birth year (optional)<input name="year" type="number" min="1" max="${now.getFullYear()}" value="${esc(p.year || "")}"></label><label>Relationship<input name="relationship" value="${esc(p.relationship)}"></label><label>General notes<textarea name="notes">${esc(p.notes)}</textarea></label><p class="error" id="formError"></p><div class="actions"><button type="button" data-close>Cancel</button><button class="primary">Save birthday</button></div></form>`;
  if (!modal.open) modal.showModal();
  $("#personForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const d = Number(f.day),
      m = Number(f.month),
      y = Number(f.year) || null;
    if (!f.name.trim() || d > new Date(y || 2024, m, 0).getDate()) {
      $("#formError").textContent = "Enter a name and a valid birthday.";
      return;
    }
    const updated = {
      ...p,
      id: p.id || crypto.randomUUID(),
      name: f.name.trim(),
      day: d,
      month: m,
      year: y,
      relationship: f.relationship,
      notes: f.notes,
    };
    if (isNew) state.people.push(updated);
    else state.people = state.people.map((x) => (x.id === p.id ? updated : x));
    await persist();
    modal.close();
    render();
    personDetail(updated, nextBirthday(updated, now).getFullYear());
  };
}
function personDetail(p, y) {
  const g = plan(p, y),
    d = birthday(p, y);
  modal.innerHTML = `<div class="row between"><h1 class="grow">${esc(p.name)}</h1><button data-close aria-label="Close">✕</button></div><p>${fmt(d)} ${p.year ? "· " + p.year : ""} · ${esc(age(p, y))}</p><p class="muted">${esc(p.relationship)} ${esc(p.notes)}</p><button data-edit="${esc(p.id)}">Edit person</button><hr><div class="row between"><button data-person="${esc(p.id)}" data-year="${y - 1}" aria-label="Previous year">‹</button><b>Birthday ${y}</b><button data-person="${esc(p.id)}" data-year="${y + 1}" aria-label="Next year">›</button></div><p class="pill" style="display:inline-block">${countdown(diff(d, now))}</p><form id="planForm"><label>Gift idea / description<textarea name="gift">${esc(g.gift)}</textarea></label><label class="check"><input type="checkbox" name="bought" ${g.bought ? "checked" : ""}>Gift purchased</label><label class="check"><input type="checkbox" name="wrapped" ${g.wrapped ? "checked" : ""}>Gift wrapped</label><h2>Party</h2><label>Date<input type="date" name="party" value="${esc(g.party)}"></label><label>Time<input type="time" name="time" value="${esc(g.time)}"></label><label>Location<input name="location" value="${esc(g.location)}"></label><label>Notes for this year<textarea name="notes">${esc(g.notes)}</textarea></label><div class="actions"><button class="primary">Save details</button></div></form><hr><h2>Gift history</h2>${
    Object.entries(p.plans || {})
      .filter(([yr, v]) => Number(yr) !== y && (v.gift || v.bought))
      .sort((a, b) => b[0] - a[0])
      .map(
        ([yr, v]) =>
          `<p><button data-person="${esc(p.id)}" data-year="${yr}">${yr}</button> ${esc(v.gift || gift(v))}</p>`,
      )
      .join("") || "<small>No other gifts recorded.</small>"
  }<hr><button class="danger" data-delete="${esc(p.id)}">Delete person</button>`;
  if (!modal.open) modal.showModal();
  $("#planForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    p.plans ??= {};
    p.plans[y] = {
      ...f,
      bought: !!f.bought || !!f.wrapped,
      wrapped: !!f.wrapped,
    };
    await persist();
    render();
    modal.close();
  };
}
function migrateGiftCost(record) {
  if (!Object.prototype.hasOwnProperty.call(record, "cost")) return;
  const cost = String(record.cost ?? "").trim();
  if (cost) {
    record.gift = [record.gift, `Price: €${cost}`].filter(Boolean).join("\n");
  }
  delete record.cost;
}

function validate(raw) {
  if (raw?.version !== 1 || !Array.isArray(raw.people))
    throw Error("Unsupported backup format");
  const ids = new Set();
  for (const p of raw.people) {
    if (
      typeof p.id !== "string" ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      !Number.isInteger(p.month) ||
      p.month < 1 ||
      p.month > 12 ||
      !Number.isInteger(p.day) ||
      p.day < 1 ||
      p.day > new Date(2024, p.month, 0).getDate()
    )
      throw Error("Invalid person in backup");
    ids.add(p.id);
    if (p.plans && (typeof p.plans !== "object" || Array.isArray(p.plans)))
      throw Error("Invalid plans");
    for (const [y, g] of Object.entries(p.plans || {})) {
      if (
        !/^\d{4}$/.test(y) ||
        !g ||
        typeof g !== "object" ||
        (g.party &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(g.party) ||
            dayKey(parseDay(g.party)) !== g.party))
      )
        throw Error("Invalid party or year");
    }
  }
  const festivities = raw.festivities ?? [];
  if (!Array.isArray(festivities)) throw Error("Invalid festivities");
  const festIds = new Set();
  for (const f of festivities) {
    if (
      !f ||
      typeof f.id !== "string" ||
      festIds.has(f.id) ||
      typeof f.name !== "string" ||
      !f.name.trim() ||
      typeof f.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(f.date) ||
      dayKey(parseDay(f.date)) !== f.date ||
      !Array.isArray(f.recipients) ||
      f.recipients.some(
        (r) => !r || typeof r.name !== "string" || !r.name.trim(),
      )
    )
      throw Error("Invalid festivity");
    festIds.add(f.id);
  }
  for (const p of raw.people) {
    for (const g of Object.values(p.plans || {})) migrateGiftCost(g);
  }
  for (const f of festivities) {
    for (const r of f.recipients) migrateGiftCost(r);
  }
  const settings = { ...defaults().settings, ...raw.settings };
  for (const [id] of upcomingSections) {
    if (!upcomingValues.includes(settings[id])) settings[id] = "30";
  }
  return {
    ...defaults(),
    people: raw.people,
    festivities,
    settings,
  };
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  if (d.page) {
    page = d.page;
    render();
    window.scrollTo(0, 0);
  } else if ("add" in d) {
    if (page === "festivities") editFest();
    else editPerson();
  } else if (d.fest) {
    const f = state.festivities.find((f) => f.id === d.fest);
    if (f) editFest(f);
  } else if (d.delFest) {
    if (confirm("Delete this festivity and its gifts?")) {
      state.festivities = state.festivities.filter((f) => f.id !== d.delFest);
      await persist();
      modal.close();
      render();
    }
  } else if (d.person) {
    const p = state.people.find((p) => p.id === d.person);
    if (p) personDetail(p, Number(d.year));
  } else if (d.edit) editPerson(state.people.find((p) => p.id === d.edit));
  else if ("close" in d) modal.close();
  else if (d.delete) {
    if (confirm("Delete this person and all their gift history?")) {
      state.people = state.people.filter((p) => p.id !== d.delete);
      await persist();
      modal.close();
      render();
    }
  } else if (d.shift) {
    month = new Date(
      month.getFullYear(),
      month.getMonth() + Number(d.shift),
      1,
    );
    selected = null;
    render();
  } else if (d.date) {
    selected = Number(d.date);
    render();
  } else if ("today" in d) {
    month = new Date(now.getFullYear(), now.getMonth(), 1);
    selected = now.getDate();
    render();
  } else if ("all" in d) {
    selected = null;
    render();
  } else if ("export" in d) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `birthday-planner-${dayKey(now)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } else if ("import" in d) $("#import").click();
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    search = e.target.value;
    $("#results").innerHTML = peopleRows();
  }
});
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.checked;
    await persist();
  } else if (upcomingSections.some(([id]) => id === t.id)) {
    if (!upcomingValues.includes(t.value)) return;
    state.settings[t.id] = t.value;
    await persist();
    render();
  } else if (t.id === "theme") {
    state.settings.theme = t.value;
    await persist();
    render();
  } else if (t.id === "import" && t.files[0]) {
    try {
      const data = validate(JSON.parse(await t.files[0].text()));
      if (confirm("Replace all current records with this backup?")) {
        state = data;
        await persist();
        render();
      }
    } catch (err) {
      alert("Could not restore: " + err.message);
    }
    t.value = "";
  }
});
try {
  state = validate((await load()) || defaults());
  render();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !modal.open) render();
  });
  setInterval(() => {
    if (!modal.open && dayKey(now) !== dayKey(new Date())) render();
  }, 30000);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(console.warn);
  }
} catch (e) {
  app.textContent = "Unable to open local database: " + e.message;
}
