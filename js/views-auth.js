/* Telas de boas-vindas, cadastro e entrada */
'use strict';
(function (RS) {
  const { esc } = RS;
  RS.views = RS.views || {};

  const logo = `<div class="logo"><img src="icons/icon.svg" alt=""><div><b>ReSignifica</b><span>Um pensamento de cada vez.</span></div></div>`;
  const helpLink = `<p class="muted mt">Em crise? Ligue <strong>188</strong> (CVV, 24h) ou <strong>192</strong> (SAMU). <a href="#/ajuda-publica">Ver apoio em crises</a></p>`;

  RS.views.welcome = {
    auth: true,
    render: () => `
      <div class="auth"><main class="box" id="main">
        ${logo}
        <div class="card">
          <h1>Boas-vindas!</h1>
          ${RS.content.WELCOME}
        </div>
        <div class="card soft">
          <h2>Antes de começar</h2>
          ${RS.content.NOTICE_BLOCKS.map((n) => `<h3 class="mt">${n.title}</h3><p>${n.text}</p>`).join('')}
        </div>
        <div class="card">
          <h2>Confirmações</h2>
          <form id="f-welcome">
            <label class="check"><input type="checkbox" name="age" required> <span>Tenho 18 anos ou mais.</span></label>
            <label class="check"><input type="checkbox" name="limits" required> <span>Compreendo a finalidade e os limites de utilização do ReSignifica.</span></label>
            <label class="check"><input type="checkbox" name="terms" required> <span>Li e compreendi a <a href="#/privacidade-publica">Política de Privacidade</a> e os <a href="#/termos-publicos">Termos de Uso</a>.</span></label>
            <div class="btn-row mt">
              <button class="btn" type="submit" id="wl-go" disabled>Criar minha conta</button>
              <a class="btn secondary" href="#/entrar">Já tenho conta</a>
            </div>
          </form>
        </div>
        ${helpLink}
      </main></div>`,
    mount: (root) => {
      const f = root.querySelector('#f-welcome');
      const go = root.querySelector('#wl-go');
      const upd = () => { go.disabled = !['age', 'limits', 'terms'].every((n) => f[n].checked); };
      f.addEventListener('change', upd); upd();
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        if (go.disabled) return;
        sessionStorage.setItem('rs-consent', '1');
        location.hash = '#/cadastro';
      });
    },
  };

  RS.views.signup = {
    auth: true,
    render: () => `
      <div class="auth"><main class="box" id="main">
        ${logo}
        <div class="card">
          <h1>Criar conta</h1>
          <form id="f-signup" novalidate>
            <h2>Como você gostaria de ser chamado(a)?</h2>
            <p>Este é um espaço de reflexão e autoconhecimento. Você pode utilizar seu nome, um apelido ou um nome fictício, se isso fizer você se sentir mais confortável.</p>
            <div class="field"><label for="su-name">Como podemos chamar você? <span class="hint" style="display:inline">(opcional)</span></label>
              <input id="su-name" name="name" type="text" autocomplete="nickname" maxlength="60">
              <span class="hint">Não é necessário informar seu nome verdadeiro. Você poderá alterar essa escolha quando desejar.</span></div>
            <p class="muted"><em>Você não precisa informar seu nome verdadeiro para começar a se compreender.</em></p>
            <h2 class="mt">Acesso</h2>
            <div class="field"><label for="su-email">E-mail</label>
              <input id="su-email" name="email" type="email" autocomplete="email" required>
              <span class="hint">Usado só para entrar no app neste aparelho. Nada é enviado.</span></div>
            <div class="field"><label for="su-pw">Senha</label>
              <input id="su-pw" name="pw" type="password" autocomplete="new-password" required minlength="8">
              <span class="hint">Mínimo de 8 caracteres. Use uma senha que só você saiba.</span></div>
            <div class="field"><label for="su-pw2">Confirme a senha</label>
              <input id="su-pw2" name="pw2" type="password" autocomplete="new-password" required></div>
            <div class="card warn">
              <p class="mb0"><strong>Importante:</strong> seus registros são criptografados com a sua senha e ficam guardados neste aparelho. <strong>Se esquecer a senha, não será possível recuperar os registros.</strong></p><p class="mb0 mt"><strong>Não há backup restaurável nesta versão de teste:</strong> a exportação gera uma cópia legível dos registros e o relatório gera um PDF, mas nenhum dos dois pode ser importado de volta no app. Trocar de aparelho ou limpar os dados do navegador apaga os registros.</p>
            </div>
            <label class="check"><input type="checkbox" name="ok" required> <span>Entendi como meus dados são guardados.</span></label>
            <p id="su-err" class="muted" role="alert" style="color:var(--perigo)"></p>
            <div class="btn-row"><button class="btn" type="submit">Criar conta</button><a class="btn ghost" href="#/boas-vindas">Voltar</a></div>
          </form>
        </div>
      </main></div>`,
    mount: (root) => {
      if (!sessionStorage.getItem('rs-consent')) { location.hash = '#/boas-vindas'; return; }
      const f = root.querySelector('#f-signup');
      const err = root.querySelector('#su-err');
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(f));
        err.textContent = '';
        if (!/^\S+@\S+\.\S+$/.test(d.email)) return (err.textContent = 'Informe um e-mail válido.');
        if (d.pw.length < 8) return (err.textContent = 'A senha precisa ter pelo menos 8 caracteres.');
        if (d.pw !== d.pw2) return (err.textContent = 'As senhas não conferem.');
        if (!d.ok) return (err.textContent = 'Confirme que entendeu como seus dados são guardados.');
        const btn = f.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Criando…';
        try {
          await RS.store.createAccount(d.name, d.email, d.pw);
          sessionStorage.removeItem('rs-consent');
          try { localStorage.setItem('rs-last-email', d.email.trim().toLowerCase()); } catch (x) { /* ok */ }
          RS.store.requestPersistence();
          RS.app.onLogin();
          location.hash = '#/';
          RS.toast(d.name.trim() ? `Que bom ter você aqui, ${d.name.trim()}.` : 'Que bom ter você aqui.');
        } catch (ex) {
          err.textContent = ex.message; btn.disabled = false; btn.textContent = 'Criar conta';
        }
      });
    },
  };

  RS.views.login = {
    auth: true,
    render: () => `
      <div class="auth"><main class="box" id="main">
        ${logo}
        <div class="card">
          <h1>Entrar</h1>
          <form id="f-login">
            <div class="field"><label for="li-email">E-mail</label><input id="li-email" name="email" type="email" autocomplete="email" required></div>
            <div class="field"><label for="li-pw">Senha</label><input id="li-pw" name="pw" type="password" autocomplete="current-password" required></div>
            <p id="li-err" role="alert" style="color:var(--perigo)"></p>
            <div class="btn-row"><button class="btn" type="submit">Entrar</button><a class="btn ghost" href="#/esqueci">Esqueci a senha</a></div>
          </form>
        </div>
        <p>Primeira vez aqui? <a href="#/boas-vindas">Criar conta</a></p>
        ${helpLink}
      </main></div>`,
    mount: (root) => {
      const f = root.querySelector('#f-login');
      const err = root.querySelector('#li-err');
      const last = localStorage.getItem('rs-last-email');
      if (last) { f.email.value = last; f.pw.focus(); } else f.email.focus();
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = f.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Entrando…'; err.textContent = '';
        try {
          await RS.store.login(f.email.value, f.pw.value);
          try { localStorage.setItem('rs-last-email', f.email.value.trim().toLowerCase()); } catch (x) { /* ok */ }
          RS.app.onLogin();
          location.hash = RS.app.consumeReturnTo() || '#/';
        } catch (ex) {
          err.textContent = ex.message; btn.disabled = false; btn.textContent = 'Entrar';
        }
      });
    },
  };

  RS.views.forgot = {
    auth: true,
    render: () => `
      <div class="auth"><main class="box" id="main">
        ${logo}
        <div class="card">
          <h1>Esqueci a senha</h1>
          <p>Seus registros são criptografados com a sua senha, e só você a conhece. Por segurança, <strong>não existe forma de recuperar os registros sem ela</strong>.</p>
          <p>Se não lembrar a senha, você pode apagar a conta deste aparelho e criar uma nova. Todos os registros dessa conta serão perdidos.</p>
          <form id="f-forgot">
            <div class="field"><label for="fg-email">E-mail da conta</label><input id="fg-email" name="email" type="email" required></div>
            <div class="btn-row"><button class="btn danger" type="submit">Apagar conta e dados</button><a class="btn secondary" href="#/entrar">Voltar</a></div>
          </form>
        </div>
      </main></div>`,
    mount: (root) => {
      root.querySelector('#f-forgot').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const ok = await RS.confirmDialog('Apagar conta?', `Todos os registros da conta <strong>${esc(email)}</strong> neste aparelho serão apagados de forma definitiva.`, 'Apagar definitivamente', true);
        if (!ok) return;
        const done = await RS.store.deleteAccountByEmail(email);
        RS.toast(done ? 'Conta apagada.' : 'Nenhuma conta com este e-mail neste aparelho.');
        if (done) location.hash = '#/boas-vindas';
      });
    },
  };

  const publicPage = (title, html) => ({
    auth: true,
    render: () => `<div class="auth"><main class="box" id="main">${logo}<div class="card article"><h1>${title}</h1>${typeof html === 'function' ? html() : html}</div>
      <button type="button" class="btn secondary" data-back>Voltar</button></main></div>`,
  });
  RS.views.helpPublic = publicPage('Apoio em crises', () => RS.content.CRISIS);
  RS.views.privacyPublic = publicPage('Política de Privacidade', () => RS.views.privacyText());
  RS.views.termsPublic = publicPage('Termos de Uso', () => RS.content.TERMS);

  RS.views.privacyText = () => `
    <p class="card warn">Versão provisória para o piloto. A Política de Privacidade definitiva e a base legal para dados sensíveis devem ser definidas com assessoria especializada em LGPD.</p>
    <h2>O que é guardado</h2>
    <p>Um e-mail para entrar, um nome de preferência (opcional, pode ser fictício) e o conteúdo que você registra: situações, pensamentos, emoções, reflexões e notas. Esses registros podem revelar dados pessoais sensíveis.</p>
    <h2>Onde e como</h2>
    <p>Nesta versão de teste, tudo fica <strong>neste aparelho</strong>, criptografado com AES-256 a partir da sua senha. Nenhum registro é enviado a servidores.</p>
    <h2>Compartilhamento</h2>
    <ul><li>Nada é enviado a terceiros nem a terapeutas sem uma ação explícita sua.</li><li>Não são criados links públicos para relatórios.</li></ul>
    <h2>Privacidade não é anonimato</h2>
    <p>Usar um apelido ou nome fictício pode deixar você mais à vontade, mas não garante anonimato: o e-mail e o próprio conteúdo dos relatos podem identificar uma pessoa.</p>
    <h2>Seus direitos</h2>
    <p>Em Perfil e privacidade você pode alterar seu nome de preferência, exportar seus dados, excluir registros e excluir a conta com todos os dados.</p>`;
})(window.RS);
