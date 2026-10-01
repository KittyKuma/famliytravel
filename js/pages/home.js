'use strict';
/* 홈: D-day 히어로 · 바로가기 메뉴 · 아이 카드 · 지난 여행 모음 */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, link, daysUntil, card, page } = OSAKA.ui;

  function heroCard(T) {
    const d1 = daysUntil(T.meta.startDate);
    const d3 = daysUntil(T.meta.endDate);
    let msg;
    if (d1 > 0) msg = 'D-' + d1 + ' · 출발이 <b>' + d1 + '일</b> 남았어요';
    else if (d3 >= 0) msg = '여행 중 ✈️ · 오늘도 시원하게 안전하게!';
    else msg = '여행이 끝났어요. 수고하셨어요! 💛';
    const hero = card(null, 'hero');
    hero.innerHTML =
      '<div class="hero-emoji">' + T.meta.emoji + '</div>' +
      '<h1 class="hero-title">' + esc(T.meta.title) + '</h1>' +
      '<p class="hero-sub">' + esc(T.meta.subtitle) + ' · ' + esc(T.meta.party) + '</p>' +
      '<div class="hero-count">' + msg + '</div>' +
      '<p class="hero-dates">📅 ' + esc(T.meta.dates) + '</p>' +
      '<p class="hero-hotel">🏨 ' + esc(T.meta.hotel) + ' <span class="ja">' + esc(T.meta.hotelJa) + '</span></p>' +
      '<p class="hero-hotel">🚉 ' + esc(T.meta.station) + ' <span class="ja">' + esc(T.meta.stationJa) + '</span></p>';
    return hero;
  }

  const menuItem = (href, icon, label, desc, cls) =>
    '<a class="menu-item' + (cls ? ' ' + cls : '') + '" href="' + href + '"><span class="mi-icon">' + icon + '</span><span class="mi-tx"><span class="mi-label">' + label + '</span><span class="mi-desc">' + desc + '</span></span></a>';

  pages.home = function () {
    const T = ctx.T;
    const wrap = page(true);
    if (T.archived) {
      const ar = card(null, 'note-card');
      ar.innerHTML = '<p>📦 지난 여행 기록이에요. <a href="#/home">이번 여행 가이드로 가기 ›</a></p>';
      wrap.appendChild(ar);
    }
    wrap.appendChild(heroCard(T));

    // 바로가기
    const menuCard = card('바로가기');
    menuCard.appendChild(el('div', 'menu-grid', T.menu.map(([href, icon, label, desc]) => menuItem(link(href), icon, label, desc)).join('')));
    wrap.appendChild(menuCard);

    // 아이(가족) 안내 카드
    if (T.kidCard) {
      const kid = card(T.kidCard.title, 'kid-card');
      kid.innerHTML += T.kidCard.html + '<a class="mapbtn kid" href="' + link(T.kidCard.to) + '">' + esc(T.kidCard.label) + ' <span class="go">GO</span></a>';
      wrap.appendChild(kid);
    }

    // 지난 여행 모음 (이번 여행 홈에만)
    const past = T.archived ? [] : ctx.trips.filter((t) => t.archived);
    if (past.length) {
      const pc = card('📦 지난 여행');
      pc.appendChild(el('div', 'menu-grid one', past.map((t) =>
        menuItem('#/' + t.slug + '/home', t.meta.emoji.slice(0, 2), esc(t.meta.title), esc(t.meta.menuLabel), 'past-item')).join('')));
      wrap.appendChild(pc);
    }
    return wrap;
  };
})();
