'use strict';
/*
 * 오사카 여행 가이드 — 공통 도구
 * 모든 스크립트가 공유하는 네임스페이스 window.OSAKA 를 만든다.
 *   OSAKA.ctx   : 지금 보고 있는 여행(T)과 링크 접두사(P) — 라우터(app.js)가 매번 갱신
 *   OSAKA.ui    : 화면 조각·지도 링크·저장소·일본어 도구
 *   OSAKA.pages : 페이지 렌더 함수 (js/pages/*.js 가 등록)
 * 빌드 없이 index.html 더블클릭으로도 열리도록 ES 모듈 대신 일반 스크립트를 순서대로 불러온다.
 */
(function () {
  const ctx = { T: null, P: '#/', trips: [], current: null };
  const enc = encodeURIComponent;

  // ── DOM · 문자열 ──────────────────────────────────────
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 데이터 속 '#/xxx' 링크를 지금 보고 있는 여행 기준으로 (지난 여행이면 '#/jul/xxx')
  const link = (to) => String(to).replace(/^#\//, ctx.P);

  // ── 날짜 ──────────────────────────────────────────────
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const daysUntil = (dateStr) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    return Math.round((d - t) / 86400000);
  };

  // ── 저장소 (여행별 storeNs 로 구분, 이 기기에만) ─────────
  const store = {
    get: (k, def) => { try { const v = localStorage.getItem('osaka:' + ctx.T.storeNs + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set: (k, v) => { try { localStorage.setItem('osaka:' + ctx.T.storeNs + k, JSON.stringify(v)); } catch (e) {} },
  };

  // ── 구글 지도 URL ─────────────────────────────────────
  const mapSearch = (q) => 'https://www.google.com/maps/search/?api=1&query=' + enc(q);
  const mapDir = (to) => 'https://www.google.com/maps/dir/?api=1&destination=' + enc(to) + '&travelmode=transit';
  // 경유지 포함 동선 — 구글 지도는 대중교통 모드에서 경유지를 지원하지 않아 walking/driving 사용
  const mapRoute = (r) => 'https://www.google.com/maps/dir/?api=1&origin=' + enc(r.origin) + '&destination=' + enc(r.destination) +
    (r.waypoints && r.waypoints.length ? '&waypoints=' + enc(r.waypoints.join('|')) : '') + '&travelmode=' + (r.mode || 'walking');

  // ── 화면 조각 (HTML 문자열 또는 요소) ─────────────────
  const card = (title, extraCls) => {
    const s = el('section', 'card' + (extraCls ? ' ' + extraCls : ''));
    if (title) s.appendChild(el('h2', 'card-h', title));
    return s;
  };
  const ext = (href, html, cls) => '<a class="' + (cls || 'mapbtn') + '" href="' + href + '" target="_blank" rel="noopener">' + html + '</a>';
  const mapBtn = (label, query) => ext(mapSearch(query), '📍 ' + esc(label) + ' <span class="go">지도</span>');
  const dirBtn = (query) => ext(mapDir(query), '🧭 길찾기');
  const routeBtn = (route, label) => ext(mapRoute(route), label, 'mapbtn route-btn');
  const walkBtn = (from, to, label) => routeBtn({ origin: from, destination: to, mode: 'walking' }, '🚶 ' + esc(label));
  const verifiedTag = (d) => d ? '<span class="verified">확인 ' + esc(d) + '</span>' : '';
  const kvList = (rows) => '<ul class="kv">' + rows.filter((r) => r[1]).map((r) => '<li><b>' + r[0] + '</b><span>' + r[1] + '</span></li>').join('') + '</ul>';
  const bullets = (arr) => '<ul class="bul">' + arr.map((i) => '<li>' + i + '</li>').join('') + '</ul>'; // 항목에 HTML 허용
  const textBullets = (arr) => bullets(arr.map(esc)); // 항목을 글자 그대로
  const tags = (arr) => '<div class="pm-tags">' + arr.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>';
  const steps = (arr) => {
    const ol = el('ol', 'steps');
    arr.forEach((s) => ol.innerHTML += '<li><b>' + esc(s.step) + '</b><span>' + esc(s.desc) + '</span></li>');
    return ol;
  };
  // 상단 배너 (여행별: 7월=폭염, 10월=날씨·컨디션)
  const banner = () => {
    const B = ctx.T.banner;
    if (!B) return document.createDocumentFragment();
    const b = el('a', 'heat-banner' + (B.cls ? ' ' + B.cls : ''));
    b.href = link(B.to);
    b.innerHTML = B.html + ' <span class="go">' + esc(B.go) + '</span>';
    return b;
  };
  // 페이지 공통 틀: 배너(선택) + 카드들
  const page = (withBanner) => {
    const wrap = el('div');
    if (withBanner) wrap.appendChild(banner());
    return wrap;
  };

  // ── 일본어 도구: 음성·복사·크게 보기 ───────────────────
  function speak(text) {
    if (!('speechSynthesis' in window)) { alert('이 브라우저는 음성 읽기를 지원하지 않아요.'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    const jaVoice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.indexOf('ja') === 0);
    if (jaVoice) u.voice = jaVoice;
    window.speechSynthesis.speak(u);
  }
  function copyText(text, btn) {
    const done = () => { const o = btn.textContent; btn.textContent = '✅ 복사됨'; setTimeout(() => btn.textContent = o, 1200); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
  function bigView(jp, ko) {
    const ov = el('div', 'overlay');
    ov.innerHTML = '<div class="overlay-inner"><div class="ov-jp">' + esc(jp) + '</div><div class="ov-ko">' + esc(ko) + '</div>' +
      '<div class="ov-btns"><button class="ph-btn speak-ov">🔊 듣기</button><button class="ph-btn close-ov">닫기</button></div>' +
      '<p class="ov-hint">점원·역무원에게 이 화면을 보여주세요</p></div>';
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.classList.contains('close-ov')) document.body.removeChild(ov); });
    ov.querySelector('.speak-ov').addEventListener('click', () => speak(jp));
    document.body.appendChild(ov);
  }

  window.OSAKA = {
    ctx,
    pages: {},
    ui: {
      enc, el, esc, link, todayStr, daysUntil, store,
      mapSearch, mapDir, mapRoute,
      card, ext, mapBtn, dirBtn, routeBtn, walkBtn, verifiedTag, kvList, bullets, textBullets, tags, steps, banner, page,
      speak, copyText, bigView,
    },
  };
})();
