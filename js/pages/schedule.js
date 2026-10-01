'use strict';
/* 일정: 오늘의 일정 · 전체 일정 · 비 오는 날/지친 날 대체 일정 */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, link, store, todayStr, daysUntil, card, page, mapBtn, dirBtn, routeBtn, walkBtn, verifiedTag, textBullets } = OSAKA.ui;

  const KIND_EMOJI = { move: '🚶', spot: '📍', meal: '🍽️', rest: '😴', info: 'ℹ️', shop: '🛍️' };

  // 하루 일정 카드 (항목마다 완료 체크 · 지도/길찾기/도보/관련 페이지 버튼)
  function dayCard(day) {
    const c = card(day.label, 'day-card');
    c.innerHTML += '<p class="day-theme">🎯 ' + esc(day.theme) + '</p>';
    c.innerHTML += '<p class="day-note">' + esc(day.note) + '</p>';
    if (day.route) c.innerHTML += '<div class="tl-actions">' + routeBtn(day.route, '🗺️ 이 날 동선 한눈에 (구글 지도)') + '</div>';
    const list = el('div', 'timeline');
    day.items.forEach((it, idx) => {
      const key = day.id + ':' + idx;
      const done = store.get('done:' + key, false);
      let inner = '<button class="tl-check" data-key="' + key + '" aria-label="완료">' + (done ? '✅' : '⬜') + '</button>';
      inner += '<div class="tl-body">';
      inner += '<div class="tl-top"><span class="tl-time">' + esc(it.time) + '</span><span class="tl-kind">' + (KIND_EMOJI[it.kind] || '•') + '</span>' + (it.kid ? '<span class="tl-kid">🎀 아이</span>' : '') + '</div>';
      inner += '<div class="tl-title">' + esc(it.title) + '</div>';
      if (it.place) inner += '<div class="tl-place ja">' + esc(it.place) + '</div>';
      if (it.detail) inner += '<div class="tl-detail">' + esc(it.detail) + '</div>';
      if (it.alt) inner += '<div class="tl-alt">💡 ' + esc(it.alt) + '</div>';
      if (it.verified) inner += '<div>' + verifiedTag(it.verified) + '</div>';
      inner += '<div class="tl-actions">';
      if (it.map) inner += mapBtn('지도', it.map) + ' ' + dirBtn(it.map);
      if (it.walk) inner += walkBtn(it.walk.from, it.walk.to, it.walk.label);
      if (it.link) inner += '<a class="mapbtn alt" href="' + link(it.link.to) + '">' + esc(it.link.label) + ' <span class="go">›</span></a>';
      inner += '</div></div>';
      list.appendChild(el('div', 'tl-item kind-' + it.kind + (done ? ' is-done' : ''), inner));
    });
    c.appendChild(list);
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

  function rainCard(R) {
    const c = card(R.title, 'alt-card');
    if (R.note) c.innerHTML += '<p class="note">' + esc(R.note) + '</p>';
    c.appendChild(el('div', 'rain-list', R.places.map((p) =>
      '<div class="rain-item">' +
        '<div class="rain-top"><b>' + esc(p.name) + '</b>' + (p.kid ? ' <span class="tl-kid">🎀 아이</span>' : '') + '</div>' +
        '<div class="ja">' + esc(p.ja) + '</div>' +
        '<div class="rain-why">' + esc(p.why) + '</div>' +
        '<div class="rain-meta">🚉 ' + esc(p.access) + (p.fee ? ' · 💴 ' + esc(p.fee) : '') + '</div>' +
        (p.verified ? '<div>' + verifiedTag(p.verified) + '</div>' : '') +
        '<div class="tl-actions">' + mapBtn('지도', p.map) + dirBtn(p.map) + '</div>' +
      '</div>').join('')));
    return c;
  }

  function tiredCard(t) {
    const c = card(t.title, 'alt-card');
    c.innerHTML += textBullets(t.items);
    return c;
  }

  // 오늘의 일정 (날짜 자동 선택, 여행 전이면 첫날 · 지난 뒤면 마지막 날)
  pages.today = function () {
    const T = ctx.T;
    const wrap = page(true);
    let day = T.days.find((d) => d.date === todayStr());
    let note;
    if (!day) {
      const d1 = daysUntil(T.meta.startDate);
      if (d1 > 0) { day = T.days[0]; note = '아직 여행 전이에요 (D-' + d1 + '). 첫날 일정을 미리 볼게요.'; }
      else { day = T.days[T.days.length - 1]; note = '오늘 날짜의 일정이 없어 마지막 날을 보여드려요.'; }
    }
    if (note) { const b = card(null, 'note-card'); b.innerHTML = '<p>' + note + '</p>'; wrap.appendChild(b); }
    wrap.appendChild(dayCard(day));
    return wrap;
  };

  // 전체 일정 (항공 + 3일 + 대체 일정)
  pages.plan = function () {
    const T = ctx.T;
    const wrap = page(true);
    const intro = card('🗓️ 전체 일정');
    intro.innerHTML += '<p>' + esc(T.meta.dates) + ' · ' + esc(T.meta.party) + '</p>';
    T.flights.forEach((f) => {
      intro.innerHTML += '<p class="flight">✈️ <b>' + esc(f.label) + '</b><br>' + esc(f.detail) + '<span class="tip">' + esc(f.tip) + '</span></p>';
    });
    wrap.appendChild(intro);
    T.days.forEach((d) => wrap.appendChild(dayCard(d)));
    wrap.appendChild(rainCard(T.alt.rain));
    wrap.appendChild(tiredCard(T.alt.tired));
    return wrap;
  };

  // 비 오는 날 · 지친 날
  pages.rain = function () {
    const wrap = page(true);
    wrap.appendChild(rainCard(ctx.T.alt.rain));
    wrap.appendChild(tiredCard(ctx.T.alt.tired));
    return wrap;
  };
})();
