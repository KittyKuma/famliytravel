'use strict';
/* 오사카 가족여행 가이드 — SPA 라우터 + 렌더링 + 저장 + 일본어 음성 */
(function () {
  const T = window.TRIP;
  const view = document.getElementById('view');
  const enc = encodeURIComponent;
  const mapSearch = (q) => 'https://www.google.com/maps/search/?api=1&query=' + enc(q);
  const mapDir = (to) => 'https://www.google.com/maps/dir/?api=1&destination=' + enc(to) + '&travelmode=transit';

  // ── 유틸 ──────────────────────────────────────────────
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get: (k, def) => { try { const v = localStorage.getItem('osaka:' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set: (k, v) => { try { localStorage.setItem('osaka:' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const daysUntil = (dateStr) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    return Math.round((d - t) / 86400000);
  };

  // 카드 컴포넌트
  const card = (title, extraCls) => {
    const s = el('section', 'card' + (extraCls ? ' ' + extraCls : ''));
    if (title) s.appendChild(el('h2', 'card-h', title));
    return s;
  };
  const mapBtn = (label, query, dir) => {
    return '<a class="mapbtn" href="' + (dir ? mapDir(query) : mapSearch(query)) + '" target="_blank" rel="noopener">📍 ' + esc(label) + ' <span class="go">' + (dir ? '길찾기' : '지도') + '</span></a>';
  };
  const verifiedTag = (d) => d ? '<span class="verified">확인 ' + esc(d) + '</span>' : '';

  // ── 폭염 배너(모든 페이지 상단 공용) ──────────────────
  function heatBanner() {
    const b = el('a', 'heat-banner');
    b.href = '#/heat';
    b.innerHTML = '☀️ <b>폭염 주의</b> — 한낮(11~16시) 야외 피하고 물 자주! <span class="go">안전수칙</span>';
    return b;
  }

  // ── 페이지들 ──────────────────────────────────────────
  const pages = {};

  // 홈
  pages.home = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());

    // 카운트다운 / 현재 상태
    const d1 = daysUntil(T.meta.startDate);
    const d3 = daysUntil(T.meta.endDate);
    const hero = card(null, 'hero');
    let heroMsg;
    if (d1 > 0) heroMsg = 'D-' + d1 + ' · 출발이 <b>' + d1 + '일</b> 남았어요';
    else if (d1 <= 0 && d3 >= 0) heroMsg = '여행 중 ✈️ · 오늘도 시원하게 안전하게!';
    else heroMsg = '여행이 끝났어요. 수고하셨어요! 💛';
    hero.innerHTML =
      '<div class="hero-emoji">🏯🎀🧱</div>' +
      '<h1 class="hero-title">' + esc(T.meta.title) + '</h1>' +
      '<p class="hero-sub">' + esc(T.meta.subtitle) + ' · ' + esc(T.meta.party) + '</p>' +
      '<div class="hero-count">' + heroMsg + '</div>' +
      '<p class="hero-dates">📅 ' + esc(T.meta.dates) + '</p>' +
      '<p class="hero-hotel">🏨 ' + esc(T.meta.hotel) + ' <span class="ja">' + esc(T.meta.hotelJa) + '</span></p>' +
      '<p class="hero-hotel">🚉 ' + esc(T.meta.station) + ' <span class="ja">' + esc(T.meta.stationJa) + '</span></p>';
    wrap.appendChild(hero);

    // 빠른 메뉴 그리드
    const menu = [
      ['#/today', '📍', '오늘의 일정', '날짜에 맞춰 자동'],
      ['#/plan', '🗓️', '전체 일정', 'DAY 1·2·3'],
      ['#/heat', '☀️', '폭염 안전', '가장 중요!'],
      ['#/rain', '🌧️', '비 오는 날', '실내 대체지'],
      ['#/places', '🏯', '장소 상세', '레고랜드·성·산리오'],
      ['#/food', '🍽️', '식당 추천', '아이 동반'],
      ['#/sake', '🍶', '가성비 사케', '어른 선물·기념'],
      ['#/phrases', '🗣️', '일본어 회화', '음성·복사'],
      ['#/metro', '🚉', '지하철·이동', '노선도'],
      ['#/arrival', '🛬', '공항 입국', 'KIX'],
      ['#/icoca', '💳', 'ICOCA', '교통카드'],
      ['#/checklist', '✅', '준비물', '체크'],
      ['#/budget', '💰', '여행 경비', '예산'],
      ['#/emergency', '🆘', '비상 안내', '연락처'],
    ];
    const grid = el('div', 'menu-grid');
    menu.forEach(([href, icon, label, desc]) => {
      const a = el('a', 'menu-item');
      a.href = href;
      a.innerHTML = '<span class="mi-icon">' + icon + '</span><span class="mi-tx"><span class="mi-label">' + label + '</span><span class="mi-desc">' + desc + '</span></span>';
      grid.appendChild(a);
    });
    const menuCard = card('바로가기');
    menuCard.appendChild(grid);
    wrap.appendChild(menuCard);

    // 아이 모드 안내
    const kid = card('🎀 아이 모드', 'kid-card');
    kid.innerHTML += '<p>6세 아이가 좋아할 곳만 모았어요: <b>레고랜드 블록놀이 🧱</b>, <b>오사카성 🏯</b>, <b>산리오 🎀</b>.</p>' +
      '<a class="mapbtn kid" href="#/kids">아이 코스 보기 <span class="go">GO</span></a>';
    wrap.appendChild(kid);

    return wrap;
  };

  // 오늘의 일정 (날짜 자동 선택)
  pages.today = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    const ts = todayStr();
    let day = T.days.find((d) => d.date === ts);
    let banner;
    if (!day) {
      const d1 = daysUntil(T.meta.startDate);
      if (d1 > 0) { day = T.days[0]; banner = '아직 여행 전이에요 (D-' + d1 + '). 첫날 일정을 미리 볼게요.'; }
      else { day = T.days[T.days.length - 1]; banner = '오늘 날짜의 일정이 없어 마지막 날을 보여드려요.'; }
    }
    if (banner) { const b = card(null, 'note-card'); b.innerHTML = '<p>' + banner + '</p>'; wrap.appendChild(b); }
    wrap.appendChild(renderDay(day, true));
    return wrap;
  };

  // 전체 일정
  pages.plan = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    const intro = card('🗓️ 전체 일정');
    intro.innerHTML += '<p>' + esc(T.meta.dates) + ' · ' + esc(T.meta.party) + '</p>';
    T.flights.forEach((f) => {
      intro.innerHTML += '<p class="flight">✈️ <b>' + esc(f.label) + '</b><br>' + esc(f.detail) + '<span class="tip">' + esc(f.tip) + '</span></p>';
    });
    wrap.appendChild(intro);
    T.days.forEach((d) => wrap.appendChild(renderDay(d, false)));

    // 대체 일정
    wrap.appendChild(buildRainCard());
    wrap.appendChild(buildTiredCard());
    return wrap;
  };

  // 비 오는 날 대체지 (전용 페이지)
  pages.rain = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    wrap.appendChild(buildRainCard());
    wrap.appendChild(buildTiredCard());
    return wrap;
  };

  function buildRainCard() {
    const rain = card(T.alt.rain.title, 'alt-card');
    if (T.alt.rain.note) rain.innerHTML += '<p class="note">' + esc(T.alt.rain.note) + '</p>';
    const list = el('div', 'rain-list');
    T.alt.rain.places.forEach((p) => {
      list.innerHTML += '<div class="rain-item">' +
        '<div class="rain-top"><b>' + esc(p.name) + '</b>' + (p.kid ? ' <span class="tl-kid">🎀 아이</span>' : '') + '</div>' +
        '<div class="ja">' + esc(p.ja) + '</div>' +
        '<div class="rain-why">' + esc(p.why) + '</div>' +
        '<div class="rain-meta">🚉 ' + esc(p.access) + (p.fee ? ' · 💴 ' + esc(p.fee) : '') + '</div>' +
        (p.verified ? '<div>' + verifiedTag(p.verified) + '</div>' : '') +
        '<div class="tl-actions">' + mapBtn('지도', p.map) + '<a class="mapbtn" href="' + mapDir(p.map) + '" target="_blank" rel="noopener">🧭 길찾기</a></div>' +
        '</div>';
    });
    rain.appendChild(list);
    return rain;
  }
  function buildTiredCard() {
    const tired = card(T.alt.tired.title, 'alt-card');
    tired.innerHTML += '<ul class="bul">' + T.alt.tired.items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul>';
    return tired;
  }

  function renderDay(day, single) {
    const c = card(day.label, 'day-card');
    c.innerHTML += '<p class="day-theme">🎯 ' + esc(day.theme) + '</p>';
    c.innerHTML += '<p class="day-note">' + esc(day.note) + '</p>';
    const list = el('div', 'timeline');
    day.items.forEach((it, idx) => {
      const key = day.id + ':' + idx;
      const done = store.get('done:' + key, false);
      const row = el('div', 'tl-item kind-' + it.kind + (done ? ' is-done' : ''));
      const kindEmoji = { move: '🚶', spot: '📍', meal: '🍽️', rest: '😴', info: 'ℹ️' }[it.kind] || '•';
      let inner = '<button class="tl-check" data-key="' + key + '" aria-label="완료">' + (done ? '✅' : '⬜') + '</button>';
      inner += '<div class="tl-body">';
      inner += '<div class="tl-top"><span class="tl-time">' + esc(it.time) + '</span><span class="tl-kind">' + kindEmoji + '</span>' + (it.kid ? '<span class="tl-kid">🎀 아이</span>' : '') + '</div>';
      inner += '<div class="tl-title">' + esc(it.title) + '</div>';
      if (it.place) inner += '<div class="tl-place ja">' + esc(it.place) + '</div>';
      if (it.detail) inner += '<div class="tl-detail">' + esc(it.detail) + '</div>';
      if (it.verified) inner += '<div>' + verifiedTag(it.verified) + '</div>';
      inner += '<div class="tl-actions">';
      if (it.map) inner += mapBtn('지도', it.map) + ' ' + '<a class="mapbtn" href="' + mapDir(it.map) + '" target="_blank" rel="noopener">🧭 길찾기</a>';
      if (it.link) inner += '<a class="mapbtn alt" href="' + it.link.to + '">' + esc(it.link.label) + ' <span class="go">›</span></a>';
      inner += '</div></div>';
      row.innerHTML = inner;
      list.appendChild(row);
    });
    c.appendChild(list);
    // 체크 이벤트
    c.querySelectorAll('.tl-check').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = 'done:' + btn.dataset.key;
        const nv = !store.get(k, false);
        store.set(k, nv);
        btn.textContent = nv ? '✅' : '⬜';
        btn.closest('.tl-item').classList.toggle('is-done', nv);
      });
    });
    return c;
  }

  // 폭염 안전
  pages.heat = function () {
    const wrap = el('div');
    const h = T.heat;
    const top = card(h.title, 'heat-main');
    top.innerHTML += '<p class="lead">' + esc(h.summary) + '</p>';
    wrap.appendChild(top);

    const rules = card('✅ 폭염 6수칙');
    const rl = el('div', 'rule-list');
    h.rules.forEach((r) => {
      rl.innerHTML += '<div class="rule"><span class="rule-ic">' + r.icon + '</span><div><b>' + esc(r.title) + '</b><p>' + esc(r.desc) + '</p></div></div>';
    });
    rules.appendChild(rl);
    wrap.appendChild(rules);

    const warn = card(h.warning.title, 'warn-card');
    warn.innerHTML += '<ul class="bul">' + h.warning.lines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>';
    wrap.appendChild(warn);

    const kit = card('🎒 더위 대비 가방');
    kit.innerHTML += '<div class="chips">' + h.kit.map((k) => '<span class="chip">' + esc(k) + '</span>').join('') + '</div>';
    wrap.appendChild(kit);
    return wrap;
  };

  // 아이 코스
  pages.kids = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    const c = card('🎀 아이 코스 (6세 맞춤)', 'kid-card');
    c.innerHTML += '<p>더위에 약한 아이를 위해 <b>실내·냉방·짧은 이동</b> 위주로 골랐어요.</p>';
    const kids = T.places.filter((p) => p.kid);
    const list = el('div', 'place-list');
    kids.forEach((p) => list.appendChild(placeMini(p)));
    c.appendChild(list);
    wrap.appendChild(c);
    return wrap;
  };

  function placeMini(p) {
    const a = el('a', 'place-mini');
    a.href = '#/place/' + p.id;
    a.innerHTML = '<div class="pm-top"><b>' + esc(p.name) + '</b>' + (p.kid ? '<span class="tl-kid">🎀</span>' : '') + '</div>' +
      '<div class="ja">' + esc(p.ja) + '</div>' +
      '<div class="pm-tags">' + p.tags.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>';
    return a;
  }

  // 장소 목록
  pages.places = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    const c = card('🏯 장소 상세');
    const list = el('div', 'place-list');
    T.places.forEach((p) => list.appendChild(placeMini(p)));
    c.appendChild(list);
    wrap.appendChild(c);
    return wrap;
  };

  // 장소 단일
  pages.place = function (id) {
    const p = T.places.find((x) => x.id === id);
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    if (!p) { const e = card('장소'); e.innerHTML += '<p>장소를 찾을 수 없어요.</p>'; wrap.appendChild(e); return wrap; }
    const c = card(p.name + (p.kid ? ' 🎀' : ''), 'place-detail');
    c.innerHTML += '<div class="ja">' + esc(p.ja) + ' · ' + esc(p.en) + '</div>';
    c.innerHTML += '<div class="pm-tags">' + p.tags.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>';
    const kv = [
      ['🚉 가는 법', p.access],
      ['🕘 시간', p.hours ? p.hours + ' ' + verifiedTag(p.verified) : null],
      ['💴 요금', p.fee],
    ];
    c.innerHTML += '<ul class="kv">' + kv.filter((r) => r[1]).map((r) => '<li><b>' + r[0] + '</b><span>' + r[1] + '</span></li>').join('') + '</ul>';
    if (p.tips) c.innerHTML += '<div class="tips"><b>💡 팁</b><ul class="bul">' + p.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>';
    if (p.note) c.innerHTML += '<p class="note">' + esc(p.note) + '</p>';
    c.innerHTML += '<div class="tl-actions">' + mapBtn('지도에서 보기', p.map) + '<a class="mapbtn" href="' + mapDir(p.map) + '" target="_blank" rel="noopener">🧭 길찾기</a></div>';
    wrap.appendChild(c);
    return wrap;
  };

  // 식당
  pages.food = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    const c = card('🍽️ 식당 추천 (아이 동반)');
    c.innerHTML += '<p class="note">냉방·아이 메뉴·저자극 위주로 골랐어요. 🎀 = 아이 특히 추천.</p>';
    const list = el('div', 'food-list');
    T.restaurants.forEach((r) => {
      list.innerHTML += '<div class="food">' +
        '<div class="food-top"><b>' + esc(r.name) + '</b>' + (r.kid ? '<span class="tl-kid">🎀</span>' : '') + '</div>' +
        '<div class="ja">' + esc(r.ja) + ' · ' + esc(r.area) + '</div>' +
        '<div class="food-why">' + esc(r.why) + '</div>' +
        '<div class="food-dish">🍜 추천: ' + esc(r.dish) + '</div>' +
        (r.hours ? '<div class="food-hours">🕘 ' + esc(r.hours) + '</div>' : '') +
        (r.note ? '<div class="note">' + esc(r.note) + '</div>' : '') +
        (r.verified ? '<div>' + verifiedTag(r.verified) + '</div>' : '') +
        '<div class="tl-actions">' + mapBtn(r.map ? '지도' : '근처 찾기', r.map) + '</div>' +
        '</div>';
    });
    c.appendChild(list);
    wrap.appendChild(c);
    return wrap;
  };

  // 일본어 회화 (음성·복사)
  pages.phrases = function () {
    const wrap = el('div');
    const intro = card('🗣️ 일본어 회화');
    intro.innerHTML += '<p class="note">🔊 = 소리 듣기(일본어 음성), 📋 = 복사, 🔍 = 크게 보기. 부부가 일본어를 못해도 화면을 보여주면 통해요.</p>';
    wrap.appendChild(intro);
    T.phraseGroups.forEach((g) => {
      const c = card(g.title, 'phrase-card');
      g.phrases.forEach((p) => {
        const row = el('div', 'phrase');
        row.innerHTML =
          '<div class="ph-jp" data-jp="' + esc(p.jp) + '">' + esc(p.jp) + '</div>' +
          '<div class="ph-read">🔊 ' + esc(p.read) + '</div>' +
          '<div class="ph-ko">뜻 · ' + esc(p.ko) + '</div>' +
          '<div class="ph-btns">' +
            '<button class="ph-btn speak" data-jp="' + esc(p.jp) + '">🔊 듣기</button>' +
            '<button class="ph-btn copy" data-jp="' + esc(p.jp) + '">📋 복사</button>' +
            '<button class="ph-btn big" data-jp="' + esc(p.jp) + '" data-ko="' + esc(p.ko) + '">🔍 크게</button>' +
          '</div>';
        c.appendChild(row);
      });
      wrap.appendChild(c);
    });
    // 이벤트
    wrap.querySelectorAll('.speak').forEach((b) => b.addEventListener('click', () => speak(b.dataset.jp)));
    wrap.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.jp, b)));
    wrap.querySelectorAll('.big').forEach((b) => b.addEventListener('click', () => bigView(b.dataset.jp, b.dataset.ko)));
    return wrap;
  };

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

  // 가성비 사케
  const SAKE_COLORS = ['#d9a441', '#6ea88a', '#6b7fd9'];
  function sakeBottle(label, color) {
    return '<svg class="sake-bottle" viewBox="0 0 60 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="25" y="4" width="10" height="9" rx="2" fill="#9a9aa2"/>' +
      '<rect x="26" y="11" width="8" height="27" fill="' + color + '"/>' +
      '<path d="M19 39 Q30 34 41 39 L45 62 Q46 72 46 92 L46 138 Q46 146 38 146 L22 146 Q14 146 14 138 L14 92 Q14 72 15 62 Z" fill="' + color + '"/>' +
      '<rect x="16.5" y="82" width="27" height="50" rx="3" fill="#fffef8" stroke="rgba(0,0,0,.14)"/>' +
      '<text x="30" y="90" text-anchor="middle" style="writing-mode:vertical-rl;text-orientation:upright;font-size:12px;font-weight:800;fill:#3a3a40;letter-spacing:1px">' + esc(label) + '</text>' +
    '</svg>';
  }
  pages.sake = function () {
    const wrap = el('div');
    const s = T.sake;
    const intro = card('🍶 가성비 사케 추천');
    intro.innerHTML += '<p class="lead">' + esc(s.intro) + '</p>';
    intro.innerHTML += '<p class="note">병 그림은 알아보기 쉽게 그린 일러스트예요(실제 라벨과 다를 수 있어요). 매장에선 큰 일본어 표기로 찾으세요.</p>';
    wrap.appendChild(intro);
    s.groups.forEach((g, gi) => {
      const color = SAKE_COLORS[gi % SAKE_COLORS.length];
      const c = card(g.title, 'sake-card');
      const list = el('div', 'sake-list');
      g.items.forEach((it) => {
        list.innerHTML += '<div class="sake-item">' +
          sakeBottle(it.short || it.ja, color) +
          '<div class="sake-body">' +
            '<div class="sake-top"><b>' + esc(it.name) + '</b></div>' +
            '<div class="sake-ja">' + esc(it.ja) + '</div>' +
            '<div class="sake-desc">' + esc(it.desc) + '</div>' +
            (it.price ? '<div class="sake-price">💴 ' + esc(it.price) + '</div>' : '') +
          '</div>' +
        '</div>';
      });
      c.appendChild(list);
      wrap.appendChild(c);
    });
    const tips = card('💡 고르기 · 구매 팁');
    tips.innerHTML += '<ul class="bul">' + s.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    tips.innerHTML += '<p class="note">' + esc(s.customs) + '</p><div>' + verifiedTag(s.verified) + '</div>';
    wrap.appendChild(tips);
    return wrap;
  };

  // 지하철·이동
  pages.metro = function () {
    const wrap = el('div');
    wrap.appendChild(heatBanner());
    const m = T.metro;
    const head = card('🚉 이동 안내 · 숙소 기준');
    head.innerHTML += '<p>🏠 숙소역 <b>' + esc(m.home.name) + '</b> <span class="ja">' + esc(m.home.ja) + '</span></p>' +
      '<p class="note">지나는 노선: ' + m.home.lines.map(esc).join(' · ') + '</p>';
    wrap.appendChild(head);

    m.routes.forEach((r) => {
      const c = card('→ ' + r.to, 'route-card');
      let line = '<div class="rmap">';
      r.stops.forEach((s, i) => {
        line += '<div class="rstop"><span class="rdot" style="border-color:' + r.color + '"></span><span class="rname">' + esc(s.n) + (s.ja ? ' <span class="ja">' + esc(s.ja) + '</span>' : '') + '</span></div>';
        if (i < r.stops.length - 1) line += '<div class="rline" style="background:' + r.color + '"></div>';
      });
      line += '</div>';
      c.innerHTML += line;
      c.innerHTML += '<p class="route-meta">🚆 ' + esc(r.line) + ' · ⏱ ' + esc(r.mins) + ' · ' + esc(r.walk) + '</p>';
      c.innerHTML += '<div class="tl-actions"><a class="mapbtn" href="' + mapDir(r.dest) + '" target="_blank" rel="noopener">🧭 길찾기</a></div>';
      wrap.appendChild(c);
    });

    const tips = card('💡 이동 팁');
    tips.innerHTML += '<ul class="bul">' + m.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    wrap.appendChild(tips);
    return wrap;
  };

  // 공항 입국
  pages.arrival = function () {
    const wrap = el('div');
    const a = T.arrival;
    const inb = card('🛬 간사이공항 입국 순서');
    inb.appendChild(steps(a.inbound));
    wrap.appendChild(inb);
    const out = card('🛫 출국(돌아올 때)');
    out.appendChild(steps(a.outbound));
    wrap.appendChild(out);
    const tips = card('💡 팁');
    tips.innerHTML += '<ul class="bul">' + a.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    wrap.appendChild(tips);
    return wrap;
  };
  function steps(arr) {
    const ol = el('ol', 'steps');
    arr.forEach((s) => ol.innerHTML += '<li><b>' + esc(s.step) + '</b><span>' + esc(s.desc) + '</span></li>');
    return ol;
  }

  // ICOCA (잔액 저장)
  pages.icoca = function () {
    const wrap = el('div');
    const i = T.icoca;
    const c = card('💳 ICOCA 안내');
    c.innerHTML += '<p class="lead">' + esc(i.intro) + '</p>';
    c.innerHTML += '<ul class="bul">' + i.points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>';
    c.innerHTML += '<div>' + verifiedTag(i.verified) + '</div>';
    wrap.appendChild(c);

    const bal = card('🧮 ICOCA 잔액 메모');
    bal.innerHTML += '<p class="note">' + esc(i.balanceHelp) + '</p>';
    const names = store.get('icoca:names', ['아빠', '엄마', '아이']);
    const box = el('div', 'bal-box');
    names.forEach((nm, idx) => {
      const cur = store.get('icoca:bal:' + idx, '');
      box.innerHTML += '<div class="bal-row"><span class="bal-name">' + esc(nm) + '</span>' +
        '<div class="bal-in"><input type="number" inputmode="numeric" data-idx="' + idx + '" value="' + esc(cur) + '" placeholder="0" /> <span>엔</span></div></div>';
    });
    bal.appendChild(box);
    const save = el('button', 'save-btn', '💾 잔액 저장');
    bal.appendChild(save);
    const msg = el('p', 'save-msg');
    bal.appendChild(msg);
    save.addEventListener('click', () => {
      box.querySelectorAll('input').forEach((inp) => store.set('icoca:bal:' + inp.dataset.idx, inp.value));
      msg.textContent = '저장됐어요 (이 기기에만).';
      setTimeout(() => msg.textContent = '', 1500);
    });
    wrap.appendChild(bal);
    return wrap;
  };

  // 준비물 체크리스트
  pages.checklist = function () {
    const wrap = el('div');
    const head = card('✅ 준비물 체크리스트');
    // 진행률
    let total = 0, done = 0;
    T.checklist.forEach((g, gi) => g.items.forEach((_, ii) => { total++; if (store.get('chk:' + gi + ':' + ii, false)) done++; }));
    head.innerHTML += '<div class="progress"><div class="progress-bar" style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></div></div>' +
      '<p class="note" id="chkcount">' + done + ' / ' + total + ' 완료</p>';
    const reset = el('button', 'save-btn ghost', '↺ 전체 초기화');
    reset.addEventListener('click', () => { if (confirm('체크를 모두 초기화할까요?')) { T.checklist.forEach((g, gi) => g.items.forEach((_, ii) => store.set('chk:' + gi + ':' + ii, false))); route(); } });
    head.appendChild(reset);
    wrap.appendChild(head);

    T.checklist.forEach((g, gi) => {
      const c = card(g.group, 'check-card');
      const ul = el('ul', 'checks');
      g.items.forEach((it, ii) => {
        const on = store.get('chk:' + gi + ':' + ii, false);
        const li = el('li', on ? 'is-on' : '');
        li.innerHTML = '<label><input type="checkbox" data-gi="' + gi + '" data-ii="' + ii + '"' + (on ? ' checked' : '') + '><span>' + esc(it) + '</span></label>';
        ul.appendChild(li);
      });
      c.appendChild(ul);
      wrap.appendChild(c);
    });
    wrap.querySelectorAll('input[type=checkbox]').forEach((cb) => cb.addEventListener('change', () => {
      store.set('chk:' + cb.dataset.gi + ':' + cb.dataset.ii, cb.checked);
      cb.closest('li').classList.toggle('is-on', cb.checked);
      // 진행률 갱신
      let t = 0, d = 0;
      T.checklist.forEach((g, gi) => g.items.forEach((_, ii) => { t++; if (store.get('chk:' + gi + ':' + ii, false)) d++; }));
      const cnt = document.getElementById('chkcount'); if (cnt) cnt.textContent = d + ' / ' + t + ' 완료';
      const bar = document.querySelector('.progress-bar'); if (bar) bar.style.width = (t ? Math.round(d / t * 100) : 0) + '%';
    }));
    return wrap;
  };

  // 여행 경비
  pages.budget = function () {
    const wrap = el('div');
    const b = T.budget;
    const c = card('💰 여행 경비 (예상)');
    c.innerHTML += '<p class="note">' + esc(b.note) + ' ' + verifiedTag(b.verified) + '</p>';
    let totalYen = 0;
    let rows = '';
    b.items.forEach((it) => {
      totalYen += it.yen;
      rows += '<tr><td>' + esc(it.label) + '</td><td class="num">¥' + it.yen.toLocaleString() + '</td><td class="sub">' + esc(it.per) + '</td></tr>';
    });
    const won = Math.round(totalYen * b.yenPerWon);
    c.innerHTML += '<table class="budget"><thead><tr><th>항목</th><th class="num">엔</th><th>비고</th></tr></thead><tbody>' + rows +
      '<tr class="total"><td>합계</td><td class="num">¥' + totalYen.toLocaleString() + '</td><td class="sub">≈ ' + won.toLocaleString() + '원</td></tr>' +
      '</tbody></table>';
    c.innerHTML += '<p class="note">환율 100엔 ≈ ' + Math.round(100 * b.yenPerWon).toLocaleString() + '원 기준(변동). 실제 환율로 다시 확인하세요.</p>';
    wrap.appendChild(c);
    return wrap;
  };

  // 비상 안내
  pages.emergency = function () {
    const wrap = el('div');
    const e = T.emergency;
    const c = card('🆘 비상 연락처', 'warn-card');
    const ul = el('ul', 'contacts');
    e.contacts.forEach((ct) => {
      ul.innerHTML += '<li><div class="ct-l"><b>' + esc(ct.label) + '</b><span>' + esc(ct.desc) + '</span></div>' +
        '<a class="ct-tel" href="tel:' + esc(ct.tel) + '">📞 ' + esc(ct.num) + '</a></li>';
    });
    c.appendChild(ul);
    wrap.appendChild(c);

    const boxes = [
      ['🏥 아플 때', e.hospital],
      ['🛂 여권·분실', e.lost],
      ['☀️ 온열질환', e.heat],
      ['📝 미리 준비', e.memo],
    ];
    boxes.forEach(([t, d]) => { const bc = card(t); bc.innerHTML += '<p>' + esc(d) + '</p>'; wrap.appendChild(bc); });
    return wrap;
  };

  // ── 라우터 ────────────────────────────────────────────
  function route() {
    const hash = location.hash || '#/home';
    const parts = hash.replace(/^#\//, '').split('/');
    const name = parts[0] || 'home';
    let node;
    if (name === 'place' && parts[1]) node = pages.place(parts[1]);
    else if (pages[name]) node = pages[name]();
    else node = pages.home();
    view.innerHTML = '';
    view.appendChild(node);

    // 하단 면책
    const foot = el('p', 'disclaimer', '⚠️ ' + esc(T.disclaimer));
    view.appendChild(foot);
    // 저장 안내
    view.appendChild(el('p', 'privacy', '🔒 체크·잔액 등은 이 기기에만 저장되고 외부로 전송되지 않아요. 여권번호·결제정보는 저장하지 않습니다.'));

    // 활성 탭
    document.querySelectorAll('.tabbar a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#/' + (['today', 'plan', 'heat', 'phrases'].includes(name) ? name : name === 'home' ? 'home' : name));
    });
    window.scrollTo(0, 0);
    updateTodayBadge();
  }

  function updateTodayBadge() {
    const d1 = daysUntil(T.meta.startDate);
    const badge = document.getElementById('dbadge');
    if (badge) {
      if (d1 > 0) badge.textContent = 'D-' + d1;
      else if (d1 <= 0 && daysUntil(T.meta.endDate) >= 0) badge.textContent = '여행중';
      else badge.textContent = '';
      badge.style.display = badge.textContent ? '' : 'none';
    }
  }

  window.addEventListener('hashchange', route);

  // 음성 목록 미리 로드 (일부 브라우저 지연 대응)
  if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); }

  // PWA 설치
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) { btn.hidden = false; btn.onclick = async () => { btn.hidden = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }; }
  });

  // 서비스워커
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  route();
})();
