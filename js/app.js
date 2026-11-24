/* Roteamento, layout, sessão (bloqueio por inatividade) e lembretes */
'use strict';
(function (RS) {
  const V = RS.views;

  const NAV = [
    ['inicio', 'Início', 'home', '#/'],
    ['momento', 'Meu momento', 'moment', '#/momento'],
    ['pensamentos', 'Meus pensamentos', 'thoughts', '#/pensamentos'],
    ['perspectivas', 'Outras perspectivas', 'perspective', '#/perspectivas'],
    ['jornada', 'Minha jornada', 'journey', '#/jornada'],
    ['aprender', 'Aprender', 'learn', '#/aprender'],
    ['perfil', 'Perfil e privacidade', 'profile', '#/perfil'],
  ];
  const MOBILE = ['inicio', 'momento', 'pensamentos', 'jornada'];

  const ROUTES = [
    [/^\/boas-vindas$/, V.welcome], [/^\/cadastro$/, V.signup], [/^\/entrar$/, V.login], [/^\/esqueci$/, V.forgot],
    [/^\/ajuda-publica$/, V.helpPublic], [/^\/privacidade-publica$/, V.privacyPublic], [/^\/termos-publicos$/, V.termsPublic],
    [/^\/?$/, V.home],
    [/^\/momento$/, V.moment], [/^\/momento\/(?<id>[\w-]+)$/, V.moment],
    [/^\/pensamentos$/, V.thoughts], [/^\/pensamentos\/(?<id>[\w-]+)$/, V.thoughtDetail],
    [/^\/registro\/(?<id>[\w-]+)\/(?<step>\d{1,2})$/, V.wizard],
    [/^\/perspectivas$/, V.perspectives], [/^\/jornada$/, V.journey],
    [/^\/aprender$/, V.learn], [/^\/aprender\/(?<id>[\w-]+)$/, V.article],
    [/^\/terapeuta$/, V.therapist], [/^\/perfil$/, V.profile], [/^\/privacidade$/, V.privacy], [/^\/termos$/, V.terms], [/^\/sobre$/, V.about], [/^\/ajuda$/, V.help],
  ];

  const app = document.getElementById('app');
  let returnTo = null;
  let lastPath = null;

  const parse = () => {
    const path = (location.hash.slice(1) || '/').split('#')[0];
    for (const [re, view] of ROUTES) { const m = path.match(re); if (m) return { path, view, params: m.groups || {} }; }
    return { path, view: V.home, params: {} };
  };

  function layout(view) {
    const cur = view.nav;
    const sideNav = NAV.map(([k, l, i, h]) => `<a href="${h}" ${cur === k ? 'aria-current="page"' : ''}>${RS.icon(i)}${l}</a>`).join('');
    const bottom = NAV.filter(([k]) => MOBILE.includes(k)).map(([k, l, i, h]) =>
      `<a href="${h}" ${cur === k ? 'aria-current="page"' : ''}>${RS.icon(i)}<span>${({ inicio: 'Início', momento: 'Momento', pensamentos: 'Pensamentos', jornada: 'Jornada' })[k]}</span></a>`).join('');
    const moreActive = !MOBILE.includes(cur);
    return `
      <div class="shell">
        <aside class="sidebar" aria-label="Navegação principal">
          <a class="brand" href="#/"><img src="icons/icon.svg" alt=""><div><b>ReSignifica</b><span>Um pensamento de cada vez.</span></div></a>
          <nav>${sideNav}
            <hr style="border:0;border-top:1px solid var(--borda);margin:10px 4px">
            <a href="#/terapeuta" ${cur === 'terapeuta' ? 'aria-current="page"' : ''}>${RS.icon('share')}Compartilhar com meu terapeuta</a>
          </nav>
          <div class="side-foot"><a class="btn ghost block small" href="#/sobre">Sobre o ReSignifica</a><a class="btn secondary block small" href="#/ajuda">${RS.icon('help')} Ajuda e apoio em crises</a></div>
        </aside>
        <div class="main">
          <header class="topbar">
            <a class="brand-mobile" href="#/"><img src="icons/icon.svg" alt=""><span>ReSignifica</span></a>
            <span class="title">${RS.esc(view.title || '')}</span>
            <div class="btn-row">
              <a class="help-btn" href="#/ajuda">${RS.icon('help')}<span>Ajuda</span></a>
              <button class="help-btn" id="lock-btn" aria-label="Sair e bloquear">${RS.icon('lock')}</button>
            </div>
          </header>
          <main class="content" id="main" tabindex="-1"></main>
        </div>
        <nav class="bottomnav" aria-label="Navegação">${bottom}
          <button type="button" id="more-btn" ${moreActive ? 'aria-current="page"' : ''} aria-haspopup="dialog">${RS.icon('more')}<span>Mais</span></button></nav>
      </div>`;
  }

  function render() {
    const { path, view, params } = parse();
    const logged = !!RS.store.session.key;

    if (!view.auth && !logged) { returnTo = location.hash; RS.store.hasAccounts().then((has) => { location.hash = has ? '#/entrar' : '#/boas-vindas'; }); return; }
    if (view.auth && logged && !['/ajuda-publica', '/privacidade-publica', '/termos-publicos'].includes(path)) { location.hash = '#/'; return; }

    const samePath = path === lastPath;
    const y = window.scrollY;
    lastPath = path;

    if (view.auth) {
      app.innerHTML = view.render(params);
      if (view.mount) view.mount(app, params);
    } else {
      if (!app.querySelector('.shell') || app.dataset.nav !== String(view.nav) || app.dataset.title !== String(view.title)) {
        app.innerHTML = layout(view); app.dataset.nav = String(view.nav); app.dataset.title = String(view.title);
        bindShell();
      }
      const old = app.querySelector('#main');
      const main = old.cloneNode(false); // novo nó: descarta listeners da tela anterior
      main.innerHTML = view.render(params);
      old.replaceWith(main);
      if (view.mount) view.mount(main, params);
    }
    document.title = view.title ? `${view.title} · ReSignifica` : 'ReSignifica';
    if (samePath) window.scrollTo(0, y);
    else { window.scrollTo(0, 0); const m = document.getElementById('main'); if (m && !view.auth) m.focus({ preventScroll: true }); }
  }

  function bindShell() {
    app.querySelector('#lock-btn').addEventListener('click', () => lock('Você saiu. Até breve.'));
    app.querySelector('#more-btn').addEventListener('click', () => {
      RS.modal({
        title: 'Mais',
        body: `<nav class="sheet-more">
          <a href="#/perspectivas">${RS.icon('perspective')}Outras perspectivas</a>
          <a href="#/terapeuta">${RS.icon('share')}Compartilhar com meu terapeuta</a>
          <a href="#/aprender">${RS.icon('learn')}Aprender</a>
          <a href="#/perfil">${RS.icon('profile')}Perfil e privacidade</a>
          <a href="#/sobre">${RS.icon('learn')}Sobre o ReSignifica</a>
          <a href="#/ajuda">${RS.icon('help')}Ajuda e apoio em crises</a></nav>`,
        actions: [{ label: 'Fechar', value: null, kind: 'secondary' }],
      });
      document.querySelectorAll('.sheet-more a').forEach((a) => a.addEventListener('click', () => { document.getElementById('modal-root').innerHTML = ''; }));
    });
  }

  /* ---------- Sessão ---------- */
  let lastActivity = Date.now();
  let timers = [];
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true }));

  function onLogin() {
    lastActivity = Date.now();
    timers.forEach(clearInterval);
    timers = [setInterval(checkIdle, 15000), setInterval(checkReminder, 30000)];
    setTimeout(checkReminder, 2000);
    app.innerHTML = ''; lastPath = null;
  }
  function checkIdle() {
    const s = RS.store.session;
    if (!s.key) return;
    if (Date.now() - lastActivity > (s.data.settings.autoLockMin || 10) * 60000) lock('Sessão encerrada por inatividade. Seus dados foram salvos.');
  }
  function afterLogout() {
    timers.forEach(clearInterval); timers = [];
    RS.report.reset(); RS.journeyReset();
    app.innerHTML = ''; lastPath = null; document.getElementById('modal-root').innerHTML = '';
  }
  async function lock(msg) {
    await RS.store.saveNow();
    RS.store.logout();
    afterLogout();
    location.hash = '#/entrar';
    if (msg) RS.toast(msg);
  }

  /* ---------- Lembretes (texto neutro, sem conteúdo emocional) ---------- */
  function checkReminder() {
    const s = RS.store.session;
    if (!s.key) return;
    const r = s.data.settings.reminder;
    if (!r || !r.enabled) return;
    const now = new Date();
    const today = RS.dayKey(now.toISOString());
    if (s.data.settings.lastReminderDay === today) return;
    const [h, m] = r.time.split(':').map(Number);
    if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
    s.data.settings.lastReminderDay = today; RS.store.save();
    const text = 'Que tal um momento para você? Se quiser, registre como está.';
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
      try { const n = new Notification('ReSignifica', { body: text, icon: 'icons/icon-192.png', tag: 'rs-reminder' }); n.onclick = () => { window.focus(); location.hash = '#/momento'; }; return; } catch (e) { /* cai no aviso interno */ }
    }
    RS.toast(text, 7000);
  }

  RS.app = { render, onLogin, lock, afterLogout, consumeReturnTo: () => { const r = returnTo; returnTo = null; return r && !/entrar|boas-vindas|cadastro/.test(r) ? r : null; } };

  document.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) { e.preventDefault(); history.length > 1 ? history.back() : (location.hash = '#/'); } });
  window.addEventListener('hashchange', render);

  if (!RS.crypto.supported()) {
    app.innerHTML = '<div class="auth"><div class="box card"><h1>Navegador não suportado</h1><p>O ReSignifica precisa de um navegador atualizado (Chrome, Safari, Edge ou Firefox) e de conexão segura (HTTPS) para proteger seus dados.</p></div></div>';
    return;
  }
  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})(window.RS);
