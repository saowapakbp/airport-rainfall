"use strict";

// must match COLORS in site_data.py
const LEGEND = [
  { key: "none", upper: 0.1, label: "ไม่มีฝน / น้อยมาก (T)", range: "< 0.1", fill: "#ffffff", drops: 0 },
  { key: "light", upper: 10.05, label: "ฝนเล็กน้อย", range: "0.1–10.0", fill: "#4fb3ee", drops: 1 },
  { key: "mod", upper: 35.05, label: "ฝนปานกลาง", range: "10.1–35.0", fill: "#1a6fcf", drops: 2 },
  { key: "heavy", upper: 90.05, label: "ฝนหนัก", range: "35.1–90.0", fill: "#f28a1a", drops: 3 },
  { key: "extreme", upper: Infinity, label: "ฝนหนักมาก", range: "> 90.0", fill: "#d9253b", drops: 4 },
];
// TMD radar composite colour scale (mm/hr), as on weather.tmd.go.th/composite
const RADAR_SCALE = ["#54A431", "#5EB738", "#66C43C", "#69CB5A", "#73DE45", "#7BEC4B", "#F3F453", "#DEDF4B", "#D6D648", "#F1C946",
  "#D79C37", "#E3622A", "#D43320", "#CA325D", "#B72D54", "#E345F5", "#EA8CF8", "#F3CBFA", "#EFE6F1"];
const RADAR_TICKS = ["0.2", "1", "3", "9", "25", "75", "200", "> 600"];
const RADAR_BASE = "https://raw.githubusercontent.com/saowapakbp/airport-rain-report/radar/";
const RADAR_REFRESH_MS = 5 * 60 * 1000;
const RADAR_STEP_MS = 600;
// radar tab is off until the nowcast is ready; fetch_radar.py and radar.yml keep the module working
const RADAR_ENABLED = false;
const OUTLOOK_LEVELS = [
  { key: "low", below: 30, label: "ต่ำ" },
  { key: "mid", below: 60, label: "ปานกลาง" },
  { key: "high", below: Infinity, label: "สูง" },
];
const REGIONS = {
  north: "ภาคเหนือ", ne_upper: "ภาคตะวันออกเฉียงเหนือตอนบน", ne_lower: "ภาคตะวันออกเฉียงเหนือตอนล่าง",
  central: "ภาคกลาง", southeast: "ภาคใต้ฝั่งตะวันออก", southwest: "ภาคใต้ฝั่งตะวันตก",
};
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_LONG = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const THAILAND = [[5.6, 97.3], [20.5, 105.7]];
const STRIP_DAYS = 7;
const MINI_ZOOM = 9;
const NO_VALUE = ["missing", "fault"];
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
const TEXT = {
  forecast: {
    title: "พยากรณ์ปริมาณฝนสะสม 24 ชั่วโมง รายท่าอากาศยาน",
    en: "Airport 24-Hour Accumulated Rainfall Forecast",
    sub: "ช่วง 07:00 น. ของวัน ถึง 07:00 น. ของวันถัดไป สำหรับสนับสนุนการปฏิบัติงานด้านการบิน",
    issue: "วันที่ออกพยากรณ์",
    period: "ช่วงเวลา",
    map: "แผนที่พยากรณ์ฝนสะสม 24 ชั่วโมง",
    list: "รายชื่อท่าอากาศยาน (พยากรณ์ฝนสะสม 24 ชั่วโมง)",
    miniTitle: "แผนภาพจากแบบจำลอง (พื้นที่โดยรอบท่าอากาศยาน)",
    strip: "พยากรณ์ 7 วัน",
    download: "ดาวน์โหลดรายงานพยากรณ์ (PNG)",
  },
  radar: {
    title: "เรดาร์ตรวจอากาศ ภาพรวมประเทศ (ล่าสุด)",
    en: "TMD Radar Composite — Rain Rate",
    sub: "อัตราฝน (มม./ชม.) จากเรดาร์ตรวจอากาศกรมอุตุนิยมวิทยา ทุก 15 นาที ย้อนหลัง 6 ชั่วโมง",
    issue: "ภาพล่าสุด",
    period: "ช่วงภาพ",
    map: "เรดาร์ตรวจอากาศ (อัตราฝน มม./ชม.)",
  },
  observed: {
    title: "ปริมาณฝนที่ตกจริง 24 ชั่วโมง รายท่าอากาศยาน",
    en: "Airport 24-Hour Observed Rainfall",
    sub: "ปริมาณฝนสะสม 07:00 น. ถึง 07:00 น. ของวันถัดไป จาก AWOS ท่าอากาศยานและสถานีตรวจอากาศกรมอุตุนิยมวิทยา",
    issue: "วันที่ตรวจวัด",
    period: "ช่วงเวลา",
    map: "แผนที่ฝนที่ตกจริง 24 ชั่วโมง",
    list: "รายชื่อท่าอากาศยาน (ฝนที่ตกจริง AWOS)",
    miniTitle: "ฝนที่ตกจริงโดยรอบท่าอากาศยาน",
    strip: "ฝนที่ตกจริง 7 วันล่าสุด (AWOS)",
    download: "ดาวน์โหลดรายงาน AWOS (PNG)",
  },
};

const state = {
  mode: "forecast", latest: null, outlook: null, dayIndex: 0, obsDates: [], obsDate: null, airports: [],
  region: "all", query: "", sort: "region", view: "cards", selected: null, cache: {}, data: null,
  radar: null, frame: 0, frameLayers: [], playing: null, radarTimer: null, shownMode: null,
};
const $ = (id) => document.getElementById(id);

const category = (mm) => LEGEND.find((c) => mm < c.upper);
const level = (p) => OUTLOOK_LEVELS.find((l) => p < l.below);
const fmt = (mm) => (mm == null ? "–" : mm < 0.1 ? "0" : mm.toFixed(1));
const parseDay = (d) => new Date(`${d}T00:00:00Z`);
const shiftDay = (d, n) => new Date(parseDay(d).getTime() + n * 86400000).toISOString().slice(0, 10);
const thaiShort = (d) => { const t = parseDay(d); return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear() + 543}`; };
const thaiDayMonth = (d) => { const t = parseDay(d); return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`; };
const thaiLong = (d) => { const t = parseDay(d); return `${t.getUTCDate()} ${MONTHS_LONG[t.getUTCMonth()]} ${t.getUTCFullYear() + 543}`; };
const weekday = (d) => WEEKDAYS[parseDay(d).getUTCDay()];
const periodText = (d) => `07:00 น. ${thaiShort(d)} – 07:00 น. ${thaiShort(shiftDay(d, 1))}`;
const cssColor = (mm) => (mm == null ? "var(--c-none)" : `var(--c-${category(mm).key})`);
const ictTime = (iso) => {
  const t = new Date(new Date(iso).getTime() + 7 * 3600000);
  const hm = `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")} น.`;
  return `${hm} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear() + 543}`;
};

const load = (url) => {
  state.cache[url] = state.cache[url] || fetch(url, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return state.cache[url];
};
const exists = (url) => fetch(url, { method: "HEAD", cache: "no-cache" }).then((r) => r.ok).catch(() => false);

// one record per airport for the current view; trace and missing AWOS reports get their own text
function record(data, icao) {
  const rec = data && data.airports[icao];
  if (!rec) return { mm: null, prob: null, status: "na", text: "–", label: "ไม่มีข้อมูล" };
  const missing = NO_VALUE.includes(rec.status);
  const status = missing ? "na" : rec.status || "value";
  const text = { na: "–", trace: "T" }[status] || fmt(rec.mm);
  const label = { na: "ไม่มีข้อมูล", trace: LEGEND[0].label }[status] || category(rec.mm).label;
  return { mm: missing ? null : rec.mm, prob: rec.prob == null ? null : rec.prob, status, text, label };
}

// seven forecast days: two WRFDA amounts, then ECMWF ENS chance of >= 10 mm
function weekOf(icao) {
  const days = state.latest ? state.latest.days.map((d) => ({ date: d.date, rec: record(d, icao) })) : [];
  const outlook = state.outlook && state.latest && state.outlook.issued === state.latest.issued ? state.outlook : null;
  const probs = outlook ? outlook.airports[icao] || [] : [];
  const later = outlook ? outlook.days.map((date, i) => ({ date, prob: probs[i] })).filter((d) => d.prob != null) : [];
  return [...days, ...later];
}

function rainIcon(mm) {
  const c = mm == null ? LEGEND[0] : category(mm);
  const cloud = { none: "#b8c6d6", light: "#8fc9ee", mod: "#4d8fd6" }[c.key] || c.fill;
  const drops = Array.from({ length: c.drops }, (_, i) =>
    `<path d="M${13 + i * 7} 31l-2 6" stroke="${c.fill}" stroke-width="2.4" stroke-linecap="round"/>`).join("");
  return `<svg class="icon" viewBox="0 0 48 40" aria-hidden="true"><use href="#i-cloud" fill="${cloud}"/>${drops}</svg>`;
}

function currentData() {
  const forecast = state.latest ? state.latest.days[state.dayIndex] : null;
  const observed = state.obsDate ? load(`data/${state.obsDate}/observed.json`) : null;
  return Promise.resolve({ forecast, observed, radar: null }[state.mode]);
}

function overlayUrl(data) {
  return state.mode === "forecast" ? `data/forecast/day${state.dayIndex}.png?v=${state.latest.issued}` : `data/${data.date}/observed.png`;
}

function makeMap(id, options) {
  const map = L.map(id, { zoomSnap: 0.25, minZoom: 4.5, maxZoom: 12, ...options });
  map.createPane("rain").style.zIndex = 350;
  map.createPane("borders").style.zIndex = 380;
  map.createPane("labels").style.zIndex = 390;
  map.getPane("labels").style.pointerEvents = "none";
  const attribution = 'Tiles &copy; <a href="https://www.esri.com">Esri</a> · กรมอุตุนิยมวิทยา · ECMWF';
  L.tileLayer(`${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { attribution, maxNativeZoom: 16 }).addTo(map);
  L.tileLayer(`${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { pane: "labels", maxNativeZoom: 16 }).addTo(map);
  const line = (color, weight) => ({ pane: "borders", interactive: false, style: { color, weight, opacity: 0.75, fill: false } });
  load("provinces.geojson").then((geo) => geo && L.geoJSON(geo, line("#8aa1b8", 0.6)).addTo(map));
  load("thailand.geojson").then((geo) => geo && L.geoJSON(geo, line("#4b6685", 1.2)).addTo(map));
  return { map, overlay: null, marks: L.layerGroup().addTo(map) };
}

function setOverlay(view, data) {
  view.overlay && view.map.removeLayer(view.overlay);
  view.overlay = data ? L.imageOverlay(overlayUrl(data), data.bounds, { pane: "rain", opacity: 0.9 }).addTo(view.map) : null;
}

function stationMarker(s) {
  return L.circleMarker([s.lat, s.lon], {
    radius: 3.5, weight: 1, color: "#4b6685", fillColor: category(s.mm).fill, fillOpacity: 1,
  }).bindTooltip(`${s.name}<br><b>${fmt(s.mm)}</b> มม.`, { className: "st-tip", direction: "top" });
}

function airportMarker(a, data) {
  const r = record(data, a.icao);
  const isRadar = state.mode === "radar";
  const isSelected = a.icao === state.selected && !isRadar;
  const cls = [isRadar ? "" : r.status === "na" ? "na" : r.mm < 0.1 ? "dry" : "", isSelected ? "sel" : ""].join(" ");
  const border = isRadar || r.mm == null ? "#9fb3c8" : category(r.mm).fill;
  const html = `<div class="ap-label ${cls}" style="--c:${border};transform:translate(-50%,-50%)">${isRadar ? a.icao : r.text}</div>`;
  return L.marker([a.lat, a.lon], { icon: L.divIcon({ className: "", html, iconSize: null }), title: `${a.icao} ${a.name}`, zIndexOffset: isSelected ? 1000 : 0 })
    .on("click", () => (isRadar ? null : select(a.icao)));
}

function drawMainMap(data) {
  const view = state.mainMap;
  setOverlay(view, state.mode === "radar" ? null : data);
  view.marks.clearLayers();
  (state.mode === "observed" && data ? data.stations : []).forEach((s) => stationMarker(s).addTo(view.marks));
  state.airports.forEach((a) => airportMarker(a, data).addTo(view.marks));
}

function visibleAirports(data) {
  const q = state.query.trim().toLowerCase();
  const order = Object.keys(REGIONS);
  const rain = (a) => record(data, a.icao).mm ?? -1;
  const sorters = {
    region: (a, b) => order.indexOf(a.region) - order.indexOf(b.region),
    rain: (a, b) => rain(b) - rain(a),
    icao: (a, b) => a.icao.localeCompare(b.icao),
  };
  return state.airports
    .filter((a) => state.region === "all" || a.region === state.region)
    .filter((a) => !q || a.icao.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
    .slice().sort(sorters[state.sort]);
}

function probChip(prob) {
  if (prob == null) return "";
  const tone = prob >= 50 ? "high" : prob >= 30 ? "mid" : "";
  return `<span class="prob ${tone}" title="โอกาสฝน ≥10 มม.">${prob}%</span>`;
}

function weekRow(icao) {
  if (state.mode !== "forecast") return "";
  const cells = weekOf(icao).map((d) => {
    const cell = d.rec
      ? `<i class="mm" style="--c:${cssColor(d.rec.mm)}">${d.rec.text}</i>`
      : `<i class="lv-${level(d.prob).key}" title="โอกาสฝน ≥10 มม. ${d.prob}%">${level(d.prob).key === "low" ? "" : `${d.prob}%`}</i>`;
    return `<span>${weekday(d.date)}${cell}</span>`;
  });
  return `<span class="week">${cells.join("")}</span>`;
}

function airportCard(a, data) {
  const r = record(data, a.icao);
  const unit = ["na", "trace"].includes(r.status) ? "" : "<small>มม.</small>";
  return `<button class="ap ${a.icao === state.selected ? "on" : ""}" data-icao="${a.icao}" style="--c:${cssColor(r.mm)}">`
    + `<span class="code">${a.icao}</span><span class="name">${a.name}</span><span class="reg">${REGIONS[a.region]}</span>`
    + `<span class="val">${rainIcon(r.mm)}<span><b>${r.text}${unit}</b><span class="cat">${r.label}</span></span></span>${probChip(r.prob)}${weekRow(a.icao)}</button>`;
}

function regionSummary(data, airports) {
  const rows = airports.map((a) => ({ a, r: record(data, a.icao) })).filter((x) => x.r.mm != null);
  const top = rows.slice().sort((x, y) => y.r.mm - x.r.mm)[0];
  return { top, wet: rows.filter((x) => x.r.mm >= 10).length, total: airports.length };
}

function renderRegions(data) {
  const strip = $("region-strip");
  strip.hidden = state.mode === "radar";
  const groups = [["all", "ทั่วประเทศ", state.airports], ...Object.entries(REGIONS).map(([k, v]) => [k, v, state.airports.filter((a) => a.region === k)])];
  strip.innerHTML = groups.map(([key, name, airports]) => {
    const s = regionSummary(data, airports);
    const max = s.top ? s.top.r.mm : null;
    const meta = `≥10 มม. <em>${s.wet}</em> จาก ${s.total} แห่ง`;
    return `<button class="rg ${state.region === key ? "on" : ""}" data-region="${key}" style="--c:${cssColor(max)}">`
      + `<span class="rg-name">${name}</span><span class="rg-max"><b>${fmt(max)}</b><small>มม. ${s.top ? s.top.a.icao : ""}</small></span>`
      + `<span class="rg-meta">${meta}</span></button>`;
  }).join("");
}

function renderList(data) {
  const list = visibleAirports(data);
  $("list-title").textContent = TEXT[state.mode].list || "";
  $("list").className = state.view;
  $("list").innerHTML = list.length ? list.map((a) => airportCard(a, data)).join("") : '<p class="empty">ไม่พบท่าอากาศยานที่ค้นหา</p>';
  renderRegions(data);
}

async function stripRows(icao) {
  if (state.mode === "forecast") {
    return weekOf(icao).map((d, i) => d.rec
      ? { label: i === 0 ? "วันนี้" : "พรุ่งนี้", value: d.rec.text, sub: thaiDayMonth(d.date), cls: i === state.dayIndex ? "on" : "", mm: d.rec.mm }
      : { label: `${weekday(d.date)} ${parseDay(d.date).getUTCDate()}`, value: `${d.prob}%`, sub: level(d.prob).label, cls: `lv-${level(d.prob).key}`, mm: null });
  }
  const days = state.obsDates.filter((d) => d <= state.obsDate).slice(-STRIP_DAYS);
  const datas = await Promise.all(days.map((d) => load(`data/${d}/observed.json`)));
  return days.map((d, i) => {
    const rec = record(datas[i], icao);
    return { label: thaiDayMonth(d), value: rec.text, sub: "มม.", cls: d === state.obsDate ? "on" : "", mm: rec.mm };
  });
}

function stripNote() {
  const outlook = state.outlook && state.latest && state.outlook.issued === state.latest.issued;
  return state.mode === "forecast" && outlook
    ? 'วันนี้–พรุ่งนี้: ปริมาณฝน (มม.) จาก WRFDA · วันที่ 3–7: โอกาสฝน ≥10 มม. จาก ECMWF ENS<i style="background:#edf3f9"></i>ต่ำ<i style="background:#ffe39a"></i>ปานกลาง<i style="background:#f5a04a"></i>สูง'
    : "";
}

function fillDetail(a, r, date) {
  $("detail").style.setProperty("--c", cssColor(r.mm));
  $("d-code").textContent = a.icao;
  $("d-name").textContent = a.name;
  $("d-region").textContent = REGIONS[a.region];
  $("d-icon").innerHTML = rainIcon(r.mm);
  $("d-mm").innerHTML = ["na", "trace"].includes(r.status) ? r.text : `${r.text}<small>มม.</small>`;
  $("d-cat").textContent = r.label;
  $("d-prob").hidden = r.prob == null;
  $("d-prob").innerHTML = `<b>${r.prob}%</b>โอกาสฝน<br>≥10 มม.`;
  $("d-period").textContent = date ? `ช่วงเวลา ${periodText(date)}` : "";
  $("i-icao").textContent = a.icao;
  $("i-region").textContent = REGIONS[a.region];
  $("i-lat").textContent = `${a.lat.toFixed(4)}° N`;
  $("i-lon").textContent = `${a.lon.toFixed(4)}° E`;
  $("d-map-title").textContent = TEXT[state.mode].miniTitle;
  $("d-strip-title").textContent = TEXT[state.mode].strip;
  $("d-note").innerHTML = stripNote();
}

async function renderDetail(data) {
  const a = state.airports.find((x) => x.icao === state.selected);
  if (!a || state.mode === "radar") return;
  fillDetail(a, record(data, a.icao), data ? data.date : state.obsDate);
  state.miniMap.map.invalidateSize();
  state.miniMap.map.setView([a.lat, a.lon], MINI_ZOOM, { animate: false });
  setOverlay(state.miniMap, data);
  state.miniMap.marks.clearLayers();
  L.circleMarker([a.lat, a.lon], { radius: 6, weight: 2.5, color: "#072f5f", fillColor: "#ffffff", fillOpacity: 1 }).addTo(state.miniMap.marks);
  const rows = await stripRows(a.icao);
  if (a.icao !== state.selected) return;
  $("d-strip").innerHTML = rows.map((row) =>
    `<div class="${row.cls}" style="--c:${cssColor(row.mm)}"><span>${row.label}</span><b>${row.value}</b><small>${row.sub}</small></div>`).join("");
}

function forecastPicker() {
  const days = state.latest ? state.latest.days : [];
  return days.map((d, i) => `<button data-day="${i}" class="${i === state.dayIndex ? "on" : ""}">${i === 0 ? "วันนี้" : "พรุ่งนี้"} ${thaiDayMonth(d.date)}</button>`).join("");
}

function observedPicker() {
  const at = state.obsDates.indexOf(state.obsDate);
  const options = state.obsDates.slice().reverse().map((d) => `<option value="${d}" ${d === state.obsDate ? "selected" : ""}>${thaiLong(d)}</option>`).join("");
  return `<button data-step="-1" ${at <= 0 ? "disabled" : ""} aria-label="วันก่อนหน้า">‹</button><select aria-label="เลือกวันที่">${options}</select><button data-step="1" ${at >= state.obsDates.length - 1 ? "disabled" : ""} aria-label="วันถัดไป">›</button>`;
}

function sourceText(data) {
  const run = data && data.run ? ` · เวลาเริ่มต้น ${data.run} (${data.initLocal})` : "";
  const members = data && data.members ? ` · เฉลี่ยจากรอบ ${data.members}` : "";
  const ens = state.outlook ? ` · วันที่ 3–7: โอกาสฝน ≥10 มม. จาก ECMWF ENS 50 สมาชิก รอบ ${state.outlook.run.slice(-2)}00 UTC (ECMWF Open Data, CC BY 4.0)` : "";
  return {
    forecast: `แบบจำลองสภาพอากาศ WRF (WRFDA) กรมอุตุนิยมวิทยา Domain 2 · 3×3 กม.${run}${members} · ค่าที่ท่าอากาศยานคือค่าเฉลี่ยพื้นที่รอบจุดอ้างอิงท่าอากาศยาน (ARP) · % คือโอกาสฝน ≥10 มม.${ens}`,
    radar: "เรดาร์ตรวจอากาศ กรมอุตุนิยมวิทยา (ภาพรวมประเทศ, weather.tmd.go.th/composite) · อัตราฝนจากสมการ Z-R Marshall-Palmer · เวลาในหน้านี้เป็นเวลาประเทศไทย",
    observed: "AWOS ท่าอากาศยาน และสถานีตรวจอากาศกรมอุตุนิยมวิทยา · พื้นที่สีประมาณค่าจากสถานีในรัศมี 60 กม. · T = ฝนน้อยมาก",
  }[state.mode];
}

function radarPeriod() {
  const frames = state.radar ? state.radar.frames : [];
  return frames.length ? `${ictTime(frames[0].t)} – ${ictTime(frames[frames.length - 1].t)}` : "ยังไม่มีข้อมูลเรดาร์";
}

function renderHeader(data) {
  const t = TEXT[state.mode];
  const forecast = state.mode === "forecast";
  const radar = state.mode === "radar";
  const latestFrame = state.radar && state.radar.frames.length ? ictTime(state.radar.latest) : "–";
  const issued = { forecast: state.latest && thaiLong(state.latest.issued), observed: state.obsDate && thaiLong(state.obsDate), radar: latestFrame }[state.mode];
  document.body.classList.toggle("radar", radar);
  $("title").textContent = t.title;
  $("title-en").textContent = t.en;
  $("subtitle").textContent = t.sub;
  $("issue-label").textContent = t.issue;
  $("period-label").textContent = t.period;
  $("issue-date").textContent = issued || "–";
  $("issue-period").textContent = radar ? radarPeriod() : data ? periodText(data.date) : "–";
  $("map-title").textContent = t.map;
  $("map-sub").textContent = radar ? "" : data ? thaiLong(data.date) : "";
  $("day-pick").innerHTML = forecast ? forecastPicker() : radar ? "" : observedPicker();
  $("download-text").textContent = t.download || "";
  $("foot-source").textContent = sourceText(data);
  $("foot-updated").textContent = state.latest ? `พยากรณ์ออกวันที่ ${thaiLong(state.latest.issued)}` : "–";
  $("legend").hidden = radar;
  $("radar-legend").hidden = !radar;
  $("player").hidden = !radar;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.mode === state.mode));
  updateDownload();
  updateSource();
}

function updateSource() {
  const sources = {
    forecast: { href: "https://hpc.tmd.go.th/products", label: "ผลผลิตต้นทาง (เลือก P24H)", name: "แบบจำลอง WRFDA · hpc.tmd.go.th" },
    observed: { href: `https://aeromet2.tmd.go.th/reports/daily-rainfall?date=${state.obsDate}`, label: "รายงานต้นทาง", name: "รายงานฝน AWOS · aeromet2" },
  };
  const source = sources[state.mode];
  const link = $("source-link");
  link.hidden = !source;
  link.href = source ? source.href : "#";
  $("source-label").textContent = source ? source.label : "";
  $("source-name").textContent = source ? source.name : "";
}

async function updateDownload() {
  const forecastUrl = state.latest && state.dayIndex === 0 && state.latest.report ? `data/forecast/${state.latest.report}` : null;
  const observedUrl = state.obsDate ? `data/${state.obsDate}/awos_report.png` : null;
  const url = { forecast: forecastUrl, observed: observedUrl, radar: null }[state.mode];
  const ok = Boolean(url) && (state.mode === "forecast" || await exists(url));
  const link = $("download");
  link.hidden = !ok;
  link.href = ok ? url : "#";
  link.setAttribute("download", ok ? url.split("/").pop().replace("awos_report", `awos_report_${state.obsDate}`) : "");
}

function showFrame(i) {
  const frames = state.radar ? state.radar.frames : [];
  if (!frames.length) return;
  state.frame = (i + frames.length) % frames.length;
  state.frameLayers.forEach((layer, k) => layer.setOpacity(k === state.frame ? 0.85 : 0));
  $("frame").value = state.frame;
  $("frame-time").textContent = ictTime(frames[state.frame].t);
}

function stopPlaying() {
  clearInterval(state.playing);
  state.playing = null;
  $("play").textContent = "▶";
}

function togglePlay() {
  if (state.playing) return stopPlaying();
  $("play").textContent = "❚❚";
  state.playing = setInterval(() => showFrame(state.frame + 1), RADAR_STEP_MS);
}

async function loadRadar() {
  const radar = await fetch(`${RADAR_BASE}radar.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!radar || (state.radar && state.radar.latest === radar.latest)) return;
  state.radar = radar;
  state.frameLayers.forEach((layer) => state.mainMap.map.removeLayer(layer));
  state.frameLayers = radar.frames.map((f) => L.imageOverlay(`${RADAR_BASE}${f.f}`, radar.bounds, { pane: "rain", opacity: 0, interactive: false }));
  state.mode === "radar" && state.frameLayers.forEach((layer) => layer.addTo(state.mainMap.map));
  $("frame").max = radar.frames.length - 1;
  showFrame(radar.frames.length - 1);
  state.mode === "radar" && renderHeader(null);
}

function enterRadar() {
  state.frameLayers.forEach((layer) => layer.addTo(state.mainMap.map));
  showFrame(state.radar ? state.radar.frames.length - 1 : 0);
  loadRadar();
  state.radarTimer = state.radarTimer || setInterval(loadRadar, RADAR_REFRESH_MS);
}

function leaveRadar() {
  stopPlaying();
  state.frameLayers.forEach((layer) => state.mainMap.map.removeLayer(layer));
}

async function render() {
  const mode = state.mode;
  const data = await currentData();
  if (mode !== state.mode) return;
  state.data = data;
  const rain = (a) => record(data, a.icao).mm ?? -1;
  const wettest = state.airports.slice().sort((a, b) => rain(b) - rain(a))[0];
  state.selected = state.selected || (wettest && wettest.icao);
  renderHeader(data);
  drawMainMap(data);
  renderList(data);
  renderDetail(data);
  ({ radar: enterRadar }[mode] || leaveRadar)();
  const switched = state.shownMode !== mode;
  state.shownMode = mode;
  setTimeout(() => {
    state.mainMap.map.invalidateSize();
    switched && state.mainMap.map.fitBounds(THAILAND);
  }, 0);
  history.replaceState(null, "", { forecast: "#forecast", radar: "#radar", observed: `#observed/${state.obsDate}` }[mode]);
}

function select(icao) {
  state.selected = icao;
  drawMainMap(state.data);
  document.querySelectorAll(".ap").forEach((el) => el.classList.toggle("on", el.dataset.icao === icao));
  renderDetail(state.data);
  window.innerWidth <= 1280 && $("detail").scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildLegends() {
  $("legend").innerHTML = LEGEND.map((c) =>
    `<li><i style="background:${c.fill};${c.key === "none" ? "border:1px solid #c4d2e0" : ""}"></i>${c.label}<span>${c.range}</span></li>`).join("");
  $("radar-legend").innerHTML = `อัตราฝน (มม./ชม.)<div class="bar">${RADAR_SCALE.map((c) => `<i style="background:${c}"></i>`).join("")}</div>`
    + `<div class="ticks">${RADAR_TICKS.map((t) => `<span>${t}</span>`).join("")}</div>`;
}

function onPick(e) {
  const b = e.target.closest("button");
  if (!b) return;
  const step = Number(b.dataset.step || 0);
  state.dayIndex = b.dataset.day != null ? Number(b.dataset.day) : state.dayIndex;
  state.obsDate = step ? state.obsDates[state.obsDates.indexOf(state.obsDate) + step] : state.obsDate;
  render();
}

function bindEvents() {
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { state.mode = b.dataset.mode; render(); }));
  document.querySelectorAll(".views button").forEach((b) => b.addEventListener("click", () => {
    state.view = b.dataset.view;
    document.querySelectorAll(".views button").forEach((x) => x.classList.toggle("on", x === b));
    renderList(state.data);
  }));
  $("region-strip").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.region = state.region === b.dataset.region ? "all" : b.dataset.region;
    renderList(state.data);
  });
  $("list").addEventListener("click", (e) => {
    const b = e.target.closest(".ap");
    b && select(b.dataset.icao);
  });
  $("q").addEventListener("input", (e) => { state.query = e.target.value; renderList(state.data); });
  $("sort").addEventListener("change", (e) => { state.sort = e.target.value; renderList(state.data); });
  $("day-pick").addEventListener("click", onPick);
  $("day-pick").addEventListener("change", (e) => { state.obsDate = e.target.value; render(); });
  $("play").addEventListener("click", togglePlay);
  $("frame").addEventListener("input", (e) => { stopPlaying(); showFrame(Number(e.target.value)); });
}

async function init() {
  const [latest, outlook, obsDates, airports] = await Promise.all([
    load("data/forecast/latest.json"), load("data/forecast/outlook.json"), load("data/index.json"), load("data/airports.json")]);
  state.latest = latest;
  state.outlook = outlook;
  state.obsDates = obsDates || [];
  state.airports = airports || [];
  const [hashMode, hashDate] = location.hash.replace("#", "").split("/");
  const allowed = TEXT[hashMode] && (hashMode !== "radar" || RADAR_ENABLED);
  state.mode = allowed ? hashMode : latest ? "forecast" : "observed";
  $("tab-radar").hidden = !RADAR_ENABLED;
  state.obsDate = state.obsDates.includes(hashDate) ? hashDate : state.obsDates[state.obsDates.length - 1] || null;
  state.mainMap = makeMap("map", { zoomControl: true });
  state.mainMap.map.fitBounds(THAILAND);
  state.miniMap = makeMap("mini", { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
  buildLegends();
  bindEvents();
  RADAR_ENABLED && loadRadar();
  render();
}

init();
