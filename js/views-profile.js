/* Perfil e privacidade: dados da conta, sessão, lembretes, exportação e exclusão */
'use strict';
(function (RS) {
  const { esc } = RS;

  RS.views.profile = {
    title: 'Perfil e privacidade', nav: 'perfil',
    render: () => {
      const { account, data } = RS.store.session;
      const s = data.settings;
      const notif = 'Notification' in window ? Notification.permission : 'unsupported';
      return `
        <h1>Perfil e privacidade</h1>
        <section class="card"><h2>Perfil</h2>
          <form id="pf-name" class="field">
            <label for="pf-n">Como gostaria de ser chamado(a)?</label>
            <div class="btn-row"><input id="pf-n" type="text" value="${esc(account.name)}" maxlength="60" style="flex:1;min-width:200px"><button class="btn secondary" type="submit">Salvar</button></div>
          </form>
          <p class="muted mb0">E-mail: ${esc(account.email)} · Conta criada em ${RS.fmtDate(account.createdAt)}</p>
        </section>

        <section class="card" id="lembretes"><h2>Lembretes</h2>
          <p class="muted">Opcionais. Um convite gentil para registrar como você está. Sem cobranças por dias sem uso.</p>
          <label class="check"><input type="checkbox" id="rm-on" ${s.reminder.enabled ? 'checked' : ''}> <span>Ativar lembrete diário</span></label>
          <div class="field" style="max-width:200px"><label for="rm-t">Horário</label><input id="rm-t" type="time" value="${esc(s.reminder.time)}" ${s.reminder.enabled ? '' : 'disabled'}></div>
          <p class="muted mb0">${notif === 'granted' ? 'Notificações permitidas neste navegador.' : notif === 'denied' ? 'As notificações estão bloqueadas neste navegador; o lembrete aparecerá dentro do app.' : notif === 'unsupported' ? 'Este navegador não suporta notificações; o lembrete aparecerá dentro do app.' : 'Ao ativar, o navegador pode pedir permissão para notificações.'}
            Nesta versão o lembrete funciona enquanto o app estiver aberto ou em segundo plano no navegador.</p>
        </section>

        <section class="card"><h2>Segurança</h2>
          <div class="field" style="max-width:320px"><label for="al">Encerrar a sessão após inatividade</label>
            <select id="al">${[2, 5, 10, 30].map((m) => `<option value="${m}" ${s.autoLockMin === m ? 'selected' : ''}>${m} minutos</option>`).join('')}</select></div>
          <details><summary>Alterar senha</summary>
            <form id="pw">
              <div class="field"><label for="pw-o">Senha atual</label><input id="pw-o" type="password" autocomplete="current-password" required></div>
              <div class="field"><label for="pw-n">Nova senha</label><input id="pw-n" type="password" autocomplete="new-password" minlength="8" required><span class="hint">Mínimo de 8 caracteres.</span></div>
              <div class="field"><label for="pw-c">Confirme a nova senha</label><input id="pw-c" type="password" autocomplete="new-password" required></div>
              <p id="pw-err" role="alert" style="color:var(--perigo)"></p>
              <button class="btn" type="submit">Alterar senha</button>
            </form>
          </details>
          <button class="btn secondary" id="lock">${RS.icon('lock')} Sair agora</button>
        </section>

        <section class="card"><h2>Seus dados</h2>
          <p>Seus registros ficam neste aparelho, criptografados com a sua senha. Não são usados para publicidade nem para treinar inteligência artificial.</p>
          <p class="muted">${data.records.filter((r) => r.persisted !== false).length} registro(s) de pensamento · ${data.checkins.length} check-in(s)</p>
          <div class="btn-row">
            <button class="btn secondary" id="exp">Exportar meus dados (JSON)</button>
            <a class="btn ghost" href="#/privacidade">Política de privacidade</a>
          </div>
          <p class="muted mt mb0">A exportação gera um arquivo <strong>sem criptografia</strong>, legível por qualquer pessoa que tenha acesso a ele. Guarde-o em local seguro.</p>
        </section>

        <section class="card danger"><h2>Excluir</h2>
          <p>Ações definitivas. Não é possível desfazer.</p>
          <div class="btn-row">
            <button class="btn secondary" id="del-recs">Excluir todos os registros</button>
            <button class="btn danger" id="del-acc">Excluir conta e todos os dados</button>
          </div>
        </section>

        <section class="card"><h2>Ajuda e avisos</h2>
          <p>O ReSignifica é uma ferramenta educativa e de autoconhecimento. Não faz diagnóstico, não oferece atendimento psicológico e não substitui terapia.</p>
          <a class="btn secondary" href="#/ajuda">${RS.icon('help')} Ajuda e apoio em crises</a>
        </section>
        <p class="muted">ReSignifica · versão protótipo 0.1 · baseado no briefing v1.0</p>`;
    },
    mount: (root) => {
      const { data } = RS.store.session;
      const s = data.settings;
      if (location.hash.endsWith('#lembretes')) setTimeout(() => root.querySelector('#lembretes').scrollIntoView(), 0);

      root.querySelector('#pf-name').addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = root.querySelector('#pf-n').value.trim();
        if (!v) return RS.toast('Informe um nome ou apelido.');
        await RS.store.updateAccountName(v); RS.toast('Nome atualizado.');
      });

      const on = root.querySelector('#rm-on'); const t = root.querySelector('#rm-t');
      on.addEventListener('change', async () => {
        s.reminder.enabled = on.checked; t.disabled = !on.checked;
        if (on.checked && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (x) { /* ok */ } }
        RS.store.save(); RS.toast(on.checked ? `Lembrete ativado para ${s.reminder.time}.` : 'Lembrete desativado.'); RS.app.render();
      });
      t.addEventListener('change', () => { if (t.value) { s.reminder.time = t.value; s.lastReminderDay = null; RS.store.save(); RS.toast(`Lembrete às ${t.value}.`); } });

      root.querySelector('#al').addEventListener('change', (e) => { s.autoLockMin = +e.target.value; RS.store.save(); RS.toast('Preferência salva.'); });

      root.querySelector('#pw').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = root.querySelector('#pw-err'); err.textContent = '';
        const o = root.querySelector('#pw-o').value; const n = root.querySelector('#pw-n').value; const c = root.querySelector('#pw-c').value;
        if (n.length < 8) return (err.textContent = 'A nova senha precisa ter pelo menos 8 caracteres.');
        if (n !== c) return (err.textContent = 'As senhas não conferem.');
        try { await RS.store.changePassword(o, n); RS.toast('Senha alterada.'); RS.app.render(); } catch (ex) { err.textContent = ex.message; }
      });

      root.querySelector('#lock').addEventListener('click', () => RS.app.lock('Você saiu. Até breve.'));

      root.querySelector('#exp').addEventListener('click', async () => {
        const ok = await RS.confirmDialog('Exportar dados', 'O arquivo terá todos os seus registros <strong>sem criptografia</strong>. Guarde-o em local seguro e não o envie a quem não deva ter acesso.', 'Exportar');
        if (!ok) return;
        const blob = new Blob([JSON.stringify(RS.store.exportData(), null, 2)], { type: 'application/json' });
        RS.downloadBlob(blob, `ReSignifica-dados-${RS.toDateInput(new Date())}.json`);
        RS.toast('Arquivo exportado para este aparelho.');
      });

      root.querySelector('#del-recs').addEventListener('click', async () => {
        const ok = await RS.confirmDialog('Excluir todos os registros?', 'Todos os registros de pensamento e check-ins serão apagados. Sua conta continua ativa.', 'Excluir registros', true);
        if (!ok) return;
        data.records = []; data.checkins = []; await RS.store.saveNow(); RS.report.reset(); RS.toast('Registros excluídos.'); RS.app.render();
      });

      root.querySelector('#del-acc').addEventListener('click', async () => {
        const r = await RS.modal({
          title: 'Excluir conta e dados',
          body: '<p>Sua conta e <strong>todos</strong> os registros deste aparelho serão apagados definitivamente.</p><div class="field"><label for="cf">Digite EXCLUIR para confirmar</label><input id="cf" name="cf" type="text" autocomplete="off"></div>',
          actions: [{ label: 'Cancelar', value: false, kind: 'secondary' }, { label: 'Excluir definitivamente', value: true, kind: 'danger' }],
        });
        if (r.value !== true) return;
        if ((r.data.cf || '').trim().toUpperCase() !== 'EXCLUIR') { RS.toast('Confirmação incorreta. Nada foi excluído.'); return; }
        await RS.store.deleteAccount();
        try { localStorage.removeItem('rs-last-email'); } catch (x) { /* ok */ }
        RS.app.afterLogout();
        location.hash = '#/boas-vindas';
        RS.toast('Conta e dados excluídos.');
      });
    },
  };
})(window.RS);
