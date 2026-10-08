'use strict';
/* 먹거리: 맛집 추천 · 가성비 사케 */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, enc, card, page, mapBtn, verifiedTag, textBullets } = OSAKA.ui;

  pages.food = function () {
    const T = ctx.T;
    const wrap = page(true);
    const c = card(T.foodTitle || '🍽️ 식당 추천 (아이 동반)');
    c.innerHTML += '<p class="note">' + (T.foodNote || '냉방·아이 메뉴·저자극 위주로 골랐어요. 🎀 = 아이 특히 추천.') + '</p>';
    c.appendChild(el('div', 'food-list', T.restaurants.map((r) =>
      '<div class="food">' +
        '<div class="food-top"><b>' + esc(r.name) + '</b>' + (r.kid ? '<span class="tl-kid">🎀</span>' : '') + '</div>' +
        '<div class="ja">' + esc(r.ja) + ' · ' + esc(r.area) + '</div>' +
        '<div class="food-why">' + esc(r.why) + '</div>' +
        '<div class="food-dish">🍜 추천: ' + esc(r.dish) + '</div>' +
        (r.price ? '<div class="food-price">💴 ' + esc(r.price) + '</div>' : '') +
        (r.hours ? '<div class="food-hours">🕘 ' + esc(r.hours) + '</div>' : '') +
        // closed 가 '⚠️'로 시작하면 노란 경고, 아니면 초록 "영업"
        (r.closed ? '<div class="food-closed' + (r.closed.indexOf('⚠️') === 0 ? ' warn' : '') + '">' + esc(r.closed) + '</div>' : '') +
        (r.note ? '<div class="note">' + esc(r.note) + '</div>' : '') +
        (r.verified ? '<div>' + verifiedTag(r.verified) + '</div>' : '') +
        '<div class="tl-actions">' + mapBtn(r.map ? '지도' : '근처 찾기', r.map) + '</div>' +
      '</div>').join('')));
    wrap.appendChild(c);
    return wrap;
  };

  // 쿠라스시 주문 방법 (단계별 안내 + 화면 버튼 이름)
  pages.kura = function () {
    const K = ctx.T.kuraGuide;
    const { bullets, steps } = OSAKA.ui;
    const wrap = page(true);
    const head = card(K.title, 'kura-head');
    head.innerHTML += '<p class="lead">' + K.intro + '</p>';
    if (K.quick) head.innerHTML += '<ol class="route-steps">' + K.quick.map((q) => '<li>' + q + '</li>').join('') + '</ol>';
    wrap.appendChild(head);
    K.sections.forEach((sec) => {
      const c = card(sec.title);
      if (sec.steps) c.appendChild(steps(sec.steps));
      if (sec.bullets) c.innerHTML += bullets(sec.bullets);
      if (sec.buttons) c.innerHTML += '<div class="kura-btns">' + sec.buttons.map((b) =>
        '<div class="kb"><span class="kb-ja">' + esc(b[0]) + '</span><span class="kb-ko">' + esc(b[1]) + '</span></div>').join('') + '</div>';
      if (sec.note) c.innerHTML += '<p class="note">' + sec.note + '</p>';
      wrap.appendChild(c);
    });
    const v = card(null, 'note-card');
    v.innerHTML = '<p>' + K.footer + ' ' + verifiedTag(K.verified) + '</p>';
    wrap.appendChild(v);
    return wrap;
  };

  // 사케 병 일러스트 (저작권 걱정 없는 SVG · 그룹마다 색)
  const SAKE_COLORS = ['#d9a441', '#6ea88a', '#6b7fd9'];
  const sakeBottle = (label, color) =>
    '<svg class="sake-bottle" viewBox="0 0 60 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="25" y="4" width="10" height="9" rx="2" fill="#9a9aa2"/>' +
      '<rect x="26" y="11" width="8" height="27" fill="' + color + '"/>' +
      '<path d="M19 39 Q30 34 41 39 L45 62 Q46 72 46 92 L46 138 Q46 146 38 146 L22 146 Q14 146 14 138 L14 92 Q14 72 15 62 Z" fill="' + color + '"/>' +
      '<rect x="16.5" y="82" width="27" height="50" rx="3" fill="#fffef8" stroke="rgba(0,0,0,.14)"/>' +
      '<text x="30" y="90" text-anchor="middle" style="writing-mode:vertical-rl;text-orientation:upright;font-size:12px;font-weight:800;fill:#3a3a40;letter-spacing:1px">' + esc(label) + '</text>' +
    '</svg>';

  pages.sake = function () {
    const s = ctx.T.sake;
    const wrap = page(false);
    const intro = card('🍶 가성비 사케 추천');
    intro.innerHTML += '<p class="lead">' + esc(s.intro) + '</p>';
    intro.innerHTML += '<p class="note">병 그림은 알아보기 쉽게 그린 일러스트예요. <b>📷 실제 사진 보기</b>로 진짜 제품을 확인하세요. 가격은 <b>720ml 병 기준 대략값</b>(정가·시중)이라 돈키호테·슈퍼 실제가는 다를 수 있어요.</p>';
    wrap.appendChild(intro);
    s.groups.forEach((g, gi) => {
      const color = SAKE_COLORS[gi % SAKE_COLORS.length];
      const c = card(g.title, 'sake-card');
      c.appendChild(el('div', 'sake-list', g.items.map((it) =>
        '<div class="sake-item">' +
          sakeBottle(it.short || it.ja, color) +
          '<div class="sake-body">' +
            '<div class="sake-top"><b>' + esc(it.name) + '</b></div>' +
            '<div class="sake-ja">' + esc(it.ja) + '</div>' +
            '<div class="sake-desc">' + esc(it.desc) + '</div>' +
            (it.price ? '<div class="sake-price">💴 ' + esc(it.price) + '</div>' : '') +
            (it.q ? '<a class="mapbtn alt sake-photo" href="https://www.google.com/search?tbm=isch&q=' + enc(it.q) + '" target="_blank" rel="noopener">📷 실제 사진 보기</a>' : '') +
          '</div>' +
        '</div>').join('')));
      wrap.appendChild(c);
    });
    const tips = card('💡 고르기 · 구매 팁');
    tips.innerHTML += textBullets(s.tips);
    tips.innerHTML += '<p class="note">' + esc(s.customs) + '</p><div>' + verifiedTag(s.verified) + '</div>';
    wrap.appendChild(tips);
    return wrap;
  };
})();
