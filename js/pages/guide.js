'use strict';
/* 안내: 날씨·컨디션(폭염) · 일본어 회화 · Visit Japan Web 도우미 · 준비물 · 경비 · 비상 */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, store, card, page, ext, verifiedTag, bullets, textBullets, steps, speak, copyText, bigView } = OSAKA.ui;

  // 날씨·컨디션 (7월 여행=폭염 안전, 10월 여행=예보+컨디션) — route 이름은 예전 링크 호환 위해 heat 유지
  function forecastCard(F) {
    const fc = card(F.title, 'forecast-card');
    if (F.lead) fc.innerHTML += '<p>' + F.lead + '</p>';
    fc.innerHTML += '<table class="budget fc-table"><thead><tr><th>날짜</th><th>날씨</th><th class="num">기온</th><th class="num">비</th></tr></thead><tbody>' +
      F.rows.map((r) => '<tr' + (r.trip ? ' class="fc-trip"' : '') + '><td>' + esc(r.date) + '</td><td>' + esc(r.wx) + '</td><td class="num">' + esc(r.temp) + '</td><td class="num">' + esc(r.rain) + '</td></tr>').join('') +
      '</tbody></table>';
    if (F.bullets) fc.innerHTML += bullets(F.bullets);
    if (F.sources) fc.innerHTML += '<div class="tl-actions">' + F.sources.map((x) => ext(x.url, '🌤 ' + esc(x.label))).join('') + '</div>';
    if (F.verified) fc.innerHTML += '<div>' + verifiedTag(F.verified) + '</div>';
    return fc;
  }

  pages.heat = function () {
    const h = ctx.T.heat;
    const wrap = page(false);
    const top = card(h.title, 'heat-main');
    top.innerHTML += '<p class="lead">' + esc(h.summary) + '</p>';
    wrap.appendChild(top);
    if (h.forecast) wrap.appendChild(forecastCard(h.forecast));

    const rules = card(h.rulesTitle || '✅ 폭염 6수칙');
    rules.appendChild(el('div', 'rule-list', h.rules.map((r) =>
      '<div class="rule"><span class="rule-ic">' + r.icon + '</span><div><b>' + esc(r.title) + '</b><p>' + esc(r.desc) + '</p></div></div>').join('')));
    wrap.appendChild(rules);

    const warn = card(h.warning.title, 'warn-card');
    warn.innerHTML += textBullets(h.warning.lines);
    wrap.appendChild(warn);

    const kit = card(h.kitTitle || '🎒 더위 대비 가방');
    kit.innerHTML += '<div class="chips">' + h.kit.map((k) => '<span class="chip">' + esc(k) + '</span>').join('') + '</div>';
    wrap.appendChild(kit);
    return wrap;
  };

  // 일본어 회화 (🔊 음성 · 📋 복사 · 🔍 크게 보기)
  pages.phrases = function () {
    const T = ctx.T;
    const wrap = page(false);
    const intro = card('🗣️ 일본어 회화');
    intro.innerHTML += '<p class="note">' + T.phrasesNote + '</p>';
    wrap.appendChild(intro);
    T.phraseGroups.forEach((g) => {
      const c = card(g.title, 'phrase-card');
      g.phrases.forEach((p) => {
        c.appendChild(el('div', 'phrase',
          '<div class="ph-jp" data-jp="' + esc(p.jp) + '">' + esc(p.jp) + '</div>' +
          '<div class="ph-read">🔊 ' + esc(p.read) + '</div>' +
          '<div class="ph-ko">뜻 · ' + esc(p.ko) + '</div>' +
          '<div class="ph-btns">' +
            '<button class="ph-btn speak" data-jp="' + esc(p.jp) + '">🔊 듣기</button>' +
            '<button class="ph-btn copy" data-jp="' + esc(p.jp) + '">📋 복사</button>' +
            '<button class="ph-btn big" data-jp="' + esc(p.jp) + '" data-ko="' + esc(p.ko) + '">🔍 크게</button>' +
          '</div>'));
      });
      wrap.appendChild(c);
    });
    wrap.querySelectorAll('.speak').forEach((b) => b.addEventListener('click', () => speak(b.dataset.jp)));
    wrap.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.jp, b)));
    wrap.querySelectorAll('.big').forEach((b) => b.addEventListener('click', () => bigView(b.dataset.jp, b.dataset.ko)));
    return wrap;
  };

  // Visit Japan Web 입력 도우미 — value 가 있으면 복사 칸, 없으면(self) 여권 보고 직접 입력 안내
  pages.vjw = function () {
    const V = ctx.T.vjw;
    const wrap = page(false);
    const head = card(V.title);
    head.innerHTML += '<p class="lead">' + V.intro + '</p>' +
      '<div class="tl-actions">' + ext(V.url, '🛂 Visit Japan Web 열기 <span class="go">›</span>') + '</div>';
    wrap.appendChild(head);
    const st = card('🧭 입력 순서');
    st.appendChild(steps(V.steps));
    wrap.appendChild(st);
    V.groups.forEach((g) => {
      const c = card(g.title, 'vjw-card');
      if (g.lead) c.innerHTML += '<p class="note">' + g.lead + '</p>';
      c.innerHTML += g.fields.map((f) =>
        '<div class="vf">' +
          '<div class="vf-label">' + esc(f.label) + (f.en ? ' <span class="vf-en">' + esc(f.en) + '</span>' : '') + '</div>' +
          (f.value != null
            ? '<div class="vf-row"><code class="vf-val">' + esc(f.value) + '</code><button class="ph-btn copy vf-copy" data-jp="' + esc(f.value) + '">📋 복사</button></div>'
            : '<div class="vf-self">✍️ ' + esc(f.self) + '</div>') +
          (f.how ? '<div class="vf-how">' + esc(f.how) + '</div>' : '') +
        '</div>').join('');
      wrap.appendChild(c);
    });
    const tips = card('💡 알아두면 편해요');
    tips.innerHTML += bullets(V.tips) + '<div>' + verifiedTag(V.verified) + '</div>';
    wrap.appendChild(tips);
    wrap.querySelectorAll('.vf-copy').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.jp, b)));
    return wrap;
  };

  // 준비물 체크리스트 (진행률 · 이 기기에 저장)
  pages.checklist = function () {
    const T = ctx.T;
    const key = (gi, ii) => 'chk:' + gi + ':' + ii;
    const progress = () => {
      let total = 0, done = 0;
      T.checklist.forEach((g, gi) => g.items.forEach((_, ii) => { total++; if (store.get(key(gi, ii), false)) done++; }));
      return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
    };
    const wrap = page(false);
    const head = card('✅ 준비물 체크리스트');
    const pr = progress();
    head.innerHTML += '<div class="progress"><div class="progress-bar" style="width:' + pr.pct + '%"></div></div>' +
      '<p class="note" id="chkcount">' + pr.done + ' / ' + pr.total + ' 완료</p>';
    const reset = el('button', 'save-btn ghost', '↺ 전체 초기화');
    reset.addEventListener('click', () => {
      if (!confirm('체크를 모두 초기화할까요?')) return;
      T.checklist.forEach((g, gi) => g.items.forEach((_, ii) => store.set(key(gi, ii), false)));
      OSAKA.route();
    });
    head.appendChild(reset);
    wrap.appendChild(head);

    T.checklist.forEach((g, gi) => {
      const c = card(g.group, 'check-card');
      const ul = el('ul', 'checks');
      g.items.forEach((it, ii) => {
        const on = store.get(key(gi, ii), false);
        ul.appendChild(el('li', on ? 'is-on' : '', '<label><input type="checkbox" data-gi="' + gi + '" data-ii="' + ii + '"' + (on ? ' checked' : '') + '><span>' + esc(it) + '</span></label>'));
      });
      c.appendChild(ul);
      wrap.appendChild(c);
    });
    wrap.querySelectorAll('input[type=checkbox]').forEach((cb) => cb.addEventListener('change', () => {
      store.set(key(cb.dataset.gi, cb.dataset.ii), cb.checked);
      cb.closest('li').classList.toggle('is-on', cb.checked);
      const p = progress();
      const cnt = document.getElementById('chkcount'); if (cnt) cnt.textContent = p.done + ' / ' + p.total + ' 완료';
      const bar = document.querySelector('.progress-bar'); if (bar) bar.style.width = p.pct + '%';
    }));
    return wrap;
  };

  // 여행 경비 (엔 합계 + 원화 환산)
  pages.budget = function () {
    const b = ctx.T.budget;
    const wrap = page(false);
    const c = card('💰 여행 경비 (예상)');
    c.innerHTML += '<p class="note">' + esc(b.note) + ' ' + verifiedTag(b.verified) + '</p>';
    const totalYen = b.items.reduce((sum, it) => sum + it.yen, 0);
    const rows = b.items.map((it) => '<tr><td>' + esc(it.label) + '</td><td class="num">¥' + it.yen.toLocaleString() + '</td><td class="sub">' + esc(it.per) + '</td></tr>').join('');
    c.innerHTML += '<table class="budget"><thead><tr><th>항목</th><th class="num">엔</th><th>비고</th></tr></thead><tbody>' + rows +
      '<tr class="total"><td>합계</td><td class="num">¥' + totalYen.toLocaleString() + '</td><td class="sub">≈ ' + Math.round(totalYen * b.yenPerWon).toLocaleString() + '원</td></tr>' +
      '</tbody></table>';
    c.innerHTML += '<p class="note">환율 100엔 ≈ ' + Math.round(100 * b.yenPerWon).toLocaleString() + '원 기준(변동). 실제 환율로 다시 확인하세요.</p>';
    wrap.appendChild(c);
    return wrap;
  };

  // 비상 연락처 + 상황별 안내
  pages.emergency = function () {
    const e = ctx.T.emergency;
    const wrap = page(false);
    const c = card('🆘 비상 연락처', 'warn-card');
    c.appendChild(el('ul', 'contacts', e.contacts.map((ct) =>
      '<li><div class="ct-l"><b>' + esc(ct.label) + '</b><span>' + esc(ct.desc) + '</span></div>' +
      '<a class="ct-tel" href="tel:' + esc(ct.tel) + '">📞 ' + esc(ct.num) + '</a></li>').join('')));
    wrap.appendChild(c);
    [['🏥 아플 때', e.hospital], ['🛂 여권·분실', e.lost], ['☀️ 온열질환', e.heat], ['📝 미리 준비', e.memo]].forEach(([t, d]) => {
      const bc = card(t);
      bc.innerHTML += '<p>' + esc(d) + '</p>';
      wrap.appendChild(bc);
    });
    return wrap;
  };
})();
