'use strict';
/* 교통: 교통 가이드 · 숙소 기준 노선도 · 공항 입국/출국 · ICOCA(잔액 메모) */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, store, card, page, ext, dirBtn, walkBtn, verifiedTag, kvList, bullets, textBullets, steps } = OSAKA.ui;

  // 교통 가이드: 섹션마다 options(비교 카드) / kv / steps / walks / bullets / note 를 조합
  function transitSection(sec) {
    const c = card(sec.title, sec.cls || '');
    if (sec.lead) c.innerHTML += '<p>' + sec.lead + '</p>';
    (sec.options || []).forEach((o) => {
      c.innerHTML += '<div class="opt' + (o.best ? ' best' : '') + '">' +
        '<div class="opt-top">' + (o.best ? '<span class="opt-badge">추천</span>' : '') + '<b>' + esc(o.name) + '</b></div>' +
        kvList([['⏱ 시간', o.time], ['💴 요금', o.fee], ['🚏 타는 곳', o.where], ['👍 장점', o.pros], ['⚠️ 주의', o.cons]]) +
        (o.link ? ext(o.link.url, esc(o.link.label) + ' <span class="go">›</span>', 'mapbtn alt') : '') +
        '</div>';
    });
    if (sec.kv) c.innerHTML += kvList(sec.kv);
    if (sec.steps) c.appendChild(steps(sec.steps));
    if (sec.walks) c.innerHTML += '<div class="tl-actions">' + sec.walks.map((w) => walkBtn(w.from, w.to, w.label)).join('') + '</div>';
    if (sec.bullets) c.innerHTML += bullets(sec.bullets);
    if (sec.note) c.innerHTML += '<p class="note">' + sec.note + '</p>';
    if (sec.verified) c.innerHTML += '<div>' + verifiedTag(sec.verified) + '</div>';
    return c;
  }

  pages.transit = function () {
    const X = ctx.T.transit;
    const wrap = page(true);
    const head = card(X.title);
    head.innerHTML += '<p class="lead">' + X.intro + '</p>';
    if (X.summary) head.innerHTML += kvList(X.summary);
    wrap.appendChild(head);
    X.sections.forEach((sec) => wrap.appendChild(transitSection(sec)));
    return wrap;
  };

  // 숙소 기준 노선도 (역 점·선으로 그린 단순 노선)
  pages.metro = function () {
    const m = ctx.T.metro;
    const wrap = page(true);
    const head = card(m.title || '🚉 이동 안내 · 숙소 기준');
    head.innerHTML += '<p>🏠 숙소역 <b>' + esc(m.home.name) + '</b> <span class="ja">' + esc(m.home.ja) + '</span></p>' +
      '<p class="note">지나는 노선: ' + m.home.lines.map(esc).join(' · ') + '</p>';
    wrap.appendChild(head);
    m.routes.forEach((r) => {
      const c = card('→ ' + r.to, 'route-card');
      c.innerHTML += '<div class="rmap">' + r.stops.map((s, i) =>
        '<div class="rstop"><span class="rdot" style="border-color:' + r.color + '"></span><span class="rname">' + esc(s.n) + (s.ja ? ' <span class="ja">' + esc(s.ja) + '</span>' : '') + '</span></div>' +
        (i < r.stops.length - 1 ? '<div class="rline" style="background:' + r.color + '"></div>' : '')).join('') + '</div>';
      c.innerHTML += '<p class="route-meta">🚆 ' + esc(r.line) + ' · ⏱ ' + esc(r.mins) + ' · ' + esc(r.walk) + '</p>';
      if (r.note) c.innerHTML += '<p class="note">' + esc(r.note) + '</p>';
      c.innerHTML += '<div class="tl-actions">' + dirBtn(r.dest) + '</div>';
      wrap.appendChild(c);
    });
    const tips = card('💡 이동 팁');
    tips.innerHTML += textBullets(m.tips);
    wrap.appendChild(tips);
    return wrap;
  };

  pages.arrival = function () {
    const a = ctx.T.arrival;
    const wrap = page(false);
    const inb = card(a.inTitle || '🛬 간사이공항 입국 순서');
    inb.appendChild(steps(a.inbound));
    wrap.appendChild(inb);
    const out = card(a.outTitle || '🛫 출국(돌아올 때)');
    out.appendChild(steps(a.outbound));
    wrap.appendChild(out);
    const tips = card('💡 팁');
    tips.innerHTML += textBullets(a.tips);
    wrap.appendChild(tips);
    return wrap;
  };

  // ICOCA 안내 + 사람별 잔액 메모(이 기기에만 저장)
  pages.icoca = function () {
    const i = ctx.T.icoca;
    const wrap = page(false);
    const c = card('💳 ICOCA 안내');
    c.innerHTML += '<p class="lead">' + esc(i.intro) + '</p>';
    c.innerHTML += textBullets(i.points);
    c.innerHTML += '<div>' + verifiedTag(i.verified) + '</div>';
    wrap.appendChild(c);

    const bal = card('🧮 ICOCA 잔액 메모');
    bal.innerHTML += '<p class="note">' + esc(i.balanceHelp) + '</p>';
    const box = el('div', 'bal-box', store.get('icoca:names', i.names).map((nm, idx) =>
      '<div class="bal-row"><span class="bal-name">' + esc(nm) + '</span>' +
      '<div class="bal-in"><input type="number" inputmode="numeric" data-idx="' + idx + '" value="' + esc(store.get('icoca:bal:' + idx, '')) + '" placeholder="0" /> <span>엔</span></div></div>').join(''));
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
})();
