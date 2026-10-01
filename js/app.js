'use strict';
/*
 * 오사카 여행 가이드 — 앱 시작점: 여행 선택 · 라우터 · 헤더/탭바 · PWA
 * 주소 규칙: 이번 여행(current:true) = #/<page>,  지난 여행 = #/<slug>/<page>,  장소 상세 = .../place/<id>
 * 페이지 렌더 함수는 js/pages/*.js 가 OSAKA.pages 에 등록한다.
 */
(function () {
  const { ctx, pages } = OSAKA;
  const { el, esc, link, daysUntil } = OSAKA.ui;
  const view = document.getElementById('view');

  // 여행 목록 (js/trips/*.js 가 window.TRIPS 에 등록)
  ctx.trips = Object.keys(window.TRIPS).sort().map((k) => window.TRIPS[k]);
  ctx.current = ctx.trips.find((t) => t.current) || ctx.trips[ctx.trips.length - 1];
  ctx.T = ctx.current;

  // 해시 → { trip, prefix, name, arg }
  function parse(hash) {
    let parts = (hash || '#/home').replace(/^#\//, '').split('/');
    const past = ctx.trips.find((t) => t !== ctx.current && t.slug === parts[0]);
    if (past) parts = parts.slice(1);
    return { trip: past || ctx.current, prefix: past ? '#/' + past.slug + '/' : '#/', name: parts[0] || 'home', arg: parts[1] };
  }

  function route() {
    const r = parse(location.hash);
    ctx.T = r.trip;
    ctx.P = r.prefix;
    renderChrome();
    let node;
    if (r.name === 'place' && r.arg) node = pages.place(r.arg);
    else if (pages[r.name] && r.name !== 'place') node = pages[r.name]();
    else node = pages.home();
    view.innerHTML = '';
    view.appendChild(node);
    view.appendChild(el('p', 'disclaimer', '⚠️ ' + esc(ctx.T.disclaimer)));
    view.appendChild(el('p', 'privacy', '🔒 체크·잔액 등은 이 기기에만 저장되고 외부로 전송되지 않아요. 여권번호·결제정보는 저장하지 않습니다.'));
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === ctx.P + r.name));
    window.scrollTo(0, 0);
    updateBadge();
  }
  OSAKA.route = route;

  // 헤더 제목·홈 링크·탭바를 보고 있는 여행에 맞게 (여행이 바뀔 때만 다시 그림)
  let chromeFor = null;
  function renderChrome() {
    const T = ctx.T;
    if (chromeFor === T) return;
    chromeFor = T;
    document.title = T.meta.title + ' 가이드';
    const ht = document.getElementById('hdTitleText');
    if (ht) ht.textContent = T.meta.title;
    const hh = document.querySelector('.hd-home');
    if (hh) hh.href = ctx.P + 'home';
    document.body.classList.toggle('archived', !!T.archived);
    const tb = document.querySelector('.tabbar');
    if (tb) tb.innerHTML = T.tabs.map(([href, icon, label]) => '<a href="' + link(href) + '">' + icon + '<span>' + label + '</span></a>').join('');
  }

  // 헤더 배지: D-n / 여행중 / (끝나면 숨김)
  function updateBadge() {
    const badge = document.getElementById('dbadge');
    if (!badge) return;
    const d1 = daysUntil(ctx.T.meta.startDate);
    if (d1 > 0) badge.textContent = 'D-' + d1;
    else if (daysUntil(ctx.T.meta.endDate) >= 0) badge.textContent = '여행중';
    else badge.textContent = '';
    badge.style.display = badge.textContent ? '' : 'none';
  }

  window.addEventListener('hashchange', route);

  // 일본어 음성 목록 미리 로드 (일부 브라우저는 늦게 채워짐)
  if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); }

  // PWA 설치 버튼
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) { btn.hidden = false; btn.onclick = async () => { btn.hidden = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }; }
  });

  // 서비스워커 (네트워크 우선) — 새 버전이 자리 잡으면 한 번만 새로고침해서 최신 화면으로
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {}));
    let reloaded = false;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      location.reload();
    });
  }

  route();
})();
