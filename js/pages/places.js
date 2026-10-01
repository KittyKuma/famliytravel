'use strict';
/* 장소: 방문처 목록(지역별) · 방문처 상세 · 아이 코스 · 동선·위치 지도 */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, card, page, mapBtn, dirBtn, routeBtn, verifiedTag, kvList, textBullets, tags } = OSAKA.ui;

  const placeHref = (p) => ctx.P + 'place/' + p.id;
  const fromHotel = (p) => p.fromHotel ? '<div class="pm-dist">🏨 숙소에서 ' + esc(p.fromHotel) + '</div>' : '';

  // 목록용 작은 카드 (누르면 상세)
  function placeMini(p) {
    const a = el('a', 'place-mini');
    a.href = placeHref(p);
    a.innerHTML = '<div class="pm-top"><b>' + esc(p.name) + '</b>' + (p.kid ? '<span class="tl-kid">🎀</span>' : '') + '</div>' +
      '<div class="ja">' + esc(p.ja) + '</div>' + fromHotel(p) + tags(p.tags);
    return a;
  }

  function placeListCard(title, desc, list) {
    const c = card(title);
    if (desc) c.innerHTML += '<p class="note">' + esc(desc) + '</p>';
    const box = el('div', 'place-list');
    list.forEach((p) => box.appendChild(placeMini(p)));
    c.appendChild(box);
    return c;
  }

  // 지역(areas)이 있으면 지역별로, 없으면 한 장에
  pages.places = function () {
    const T = ctx.T;
    const wrap = page(true);
    if (T.areas) T.areas.forEach((ar) => wrap.appendChild(placeListCard(ar.title, ar.desc, T.places.filter((p) => p.area === ar.id))));
    else wrap.appendChild(placeListCard('🏯 장소 상세', null, T.places));
    return wrap;
  };

  pages.kids = function () {
    const T = ctx.T;
    const wrap = page(true);
    const c = card(T.kids.title, 'kid-card');
    c.innerHTML += '<p>' + T.kids.intro + '</p>';
    const list = el('div', 'place-list');
    T.places.filter((p) => p.kid).forEach((p) => list.appendChild(placeMini(p)));
    c.appendChild(list);
    wrap.appendChild(c);
    return wrap;
  };

  pages.place = function (id) {
    const p = ctx.T.places.find((x) => x.id === id);
    const wrap = page(true);
    if (!p) { const e = card('장소'); e.innerHTML += '<p>장소를 찾을 수 없어요.</p>'; wrap.appendChild(e); return wrap; }
    const c = card(p.name + (p.kid ? ' 🎀' : ''), 'place-detail');
    c.innerHTML += '<div class="ja">' + esc(p.ja) + ' · ' + esc(p.en) + '</div>';
    c.innerHTML += tags(p.tags);
    c.innerHTML += kvList([
      ['📍 위치', p.where],
      ['🏨 숙소에서', p.fromHotel],
      ['🚉 가는 법', p.access],
      ['🕘 시간', p.hours ? p.hours + ' ' + verifiedTag(p.verified) : null],
      ['💴 요금', p.fee],
    ]);
    if (p.tips) c.innerHTML += '<div class="tips"><b>💡 팁</b>' + textBullets(p.tips) + '</div>';
    if (p.note) c.innerHTML += '<p class="note">' + esc(p.note) + '</p>';
    c.innerHTML += '<div class="tl-actions">' + mapBtn('지도에서 보기', p.map) + dirBtn(p.map) + '</div>';
    wrap.appendChild(c);
    return wrap;
  };

  // 동선·위치 지도: 개념도 + 날짜별 동선 + 지역별 위치
  pages.map = function () {
    const T = ctx.T;
    const M = T.mapPage;
    const wrap = page(true);
    const head = card(M.title);
    head.innerHTML += '<p class="lead">' + M.intro + '</p>' + M.svg;
    head.innerHTML += '<div class="tl-actions">' + mapBtn('숙소 ' + T.meta.hotel, T.meta.hotelMap) + '</div>';
    wrap.appendChild(head);
    T.days.filter((d) => d.route).forEach((d) => {
      const c = card('🗺️ ' + d.label + ' 동선', 'route-card');
      c.innerHTML += '<p class="day-theme">' + esc(d.theme) + '</p>';
      c.innerHTML += '<ol class="route-steps">' + [d.route.originLabel].concat(d.route.labels).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>';
      c.innerHTML += '<div class="tl-actions">' + routeBtn(d.route, '🗺️ 구글 지도로 동선 보기') + '</div>';
      wrap.appendChild(c);
    });
    T.areas.forEach((ar) => {
      const c = card(ar.title);
      if (ar.desc) c.innerHTML += '<p class="note">' + esc(ar.desc) + '</p>';
      c.appendChild(el('div', 'loc-list', T.places.filter((p) => p.area === ar.id).map((p) =>
        '<div class="loc">' +
          '<div class="loc-top"><a href="' + placeHref(p) + '"><b>' + esc(p.name) + '</b></a>' + (p.kid ? ' <span class="tl-kid">🎀</span>' : '') + '</div>' +
          '<div class="ja">' + esc(p.ja) + '</div>' +
          (p.where ? '<div class="loc-where">📍 ' + p.where + '</div>' : '') +
          fromHotel(p) +
          '<div class="tl-actions">' + mapBtn('지도', p.map) + dirBtn(p.map) + '</div>' +
        '</div>').join('')));
      wrap.appendChild(c);
    });
    return wrap;
  };
})();
