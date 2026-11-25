/* Início, Meu momento, Outras perspectivas, Aprender e Ajuda */
'use strict';
(function (RS) {
  const { esc, fmtDateTime, truncate } = RS;
  const C = RS.content;

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const todayKey = () => RS.dayKey(new Date().toISOString());
  const moodLabel = (v) => (C.MOODS.find((m) => m.v === v) || {}).label || '';

  /* ---------------- Início ---------------- */
  RS.views.home = {
    title: 'Início', nav: 'inicio',
    render: () => {
      const d = RS.store.session.data;
      const drafts = d.records.filter((r) => r.status === 'rascunho').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const recent = d.records.filter((r) => r.status !== 'rascunho').sort((a, b) => new Date(b.when) - new Date(a.when)).slice(0, 3);
      const todayCk = d.checkins.filter((c) => RS.dayKey(c.when) === todayKey()).sort((a, b) => new Date(b.when) - new Date(a.when))[0];
      const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
      return `
        <h1>${greeting()}${d.profile.name ? `, ${esc(d.profile.name)}` : ''}.</h1>
        <p class="muted">${(() => { const t = RS.fmtLong(new Date().toISOString()); return t.charAt(0).toUpperCase() + t.slice(1); })()}</p>
        ${!d.records.length && !d.checkins.length ? `<div class="card soft"><h2>Quer conhecer o app antes de usar?</h2>
          <p>Carregue alguns registros de exemplo para ver a jornada, os gráficos e o relatório para terapeuta funcionando. Você pode removê-los depois com um toque.</p>
          <button type="button" class="btn" id="demo-load">Explorar com dados de exemplo</button></div>` : ''}
        ${RS.demo.has() ? `<div class="card warn"><p class="mb0">Você está vendo <strong>dados de exemplo</strong>. <button type="button" class="btn ghost small" id="demo-clear">Remover exemplos</button></p></div>` : ''}
        <div class="big-actions">
          <a class="big-action" href="#/momento">${RS.icon('moment')}<b>Como estou hoje?</b><span>Um check-in rápido do seu momento.</span></a>
          <a class="big-action alt" href="#/registro/novo/1">${RS.icon('thoughts')}<b>Registrar pensamento</b><span>Situação, pensamento, emoção e reflexão guiada.</span></a>
        </div>
        ${todayCk ? `<div class="card soft"><p class="label mb0">Seu momento hoje</p><p class="mb0">${esc(moodLabel(todayCk.humor))}${todayCk.emocoes.length ? ' · ' + todayCk.emocoes.map((e) => `${esc(e.nome)} ${e.intensidade}`).join(', ') : ''}</p></div>` : ''}
        ${drafts.length ? `<section class="card"><h2>Para continuar quando quiser</h2>${drafts.slice(0, 3).map((r) => `
          <a class="item" href="#/registro/${r.id}/${r.step || 1}"><div class="meta"><span>${fmtDateTime(r.updatedAt)}</span><span class="badge draft">Rascunho · ${(r.step || 1) > 9 ? "revisão" : `etapa ${r.step || 1} de 9`}</span></div>
          <div class="text">${esc(truncate(RS.recordUtil.firstThought(r) || r.situacao || 'Registro iniciado', 120))}</div></a>`).join('')}</section>` : ''}
        <section>
          <div class="btn-row between"><h2 class="mb0">Registros recentes</h2><a href="#/pensamentos">Ver todos</a></div>
          <div class="mt">${recent.length ? recent.map(RS.recordItem).join('') : '<div class="empty">Seus registros aparecerão aqui.</div>'}</div>
        </section>
        <a class="card soft" href="#/terapeuta" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit">${RS.icon('share')}
          <span><strong>Compartilhar com meu terapeuta</strong><br><span class="muted">Gere um relatório em PDF com os registros que você escolher. Opcional.</span></span></a>
        <div class="card">${RS.authorCard(true)}</div>
        ${!standalone ? `<p class="muted">Dica: adicione o ReSignifica à tela inicial do celular para usar como aplicativo.</p>` : ''}`;
    },
    mount: (root) => {
      const l = root.querySelector('#demo-load');
      if (l) l.addEventListener('click', () => { RS.demo.load(); RS.toast('Exemplos carregados. Explore a Jornada e o relatório para terapeuta.', 5000); RS.app.render(); });
      const c = root.querySelector('#demo-clear');
      if (c) c.addEventListener('click', async () => {
        if (!(await RS.confirmDialog('Remover exemplos?', 'Os registros e check-ins de exemplo serão apagados. Os seus continuam.', 'Remover'))) return;
        RS.demo.clear(); RS.report.reset(); RS.toast('Exemplos removidos.'); RS.app.render();
      });
    },
  };

  /* ---------------- Meu momento ---------------- */
  const blankCheckin = () => ({ id: RS.uid(), when: new Date().toISOString(), humor: null, emocoes: [], naoIdentifica: false, contribuiu: '', notas: '' });
  const SCALE_HINT = '0 = ausência da emoção · 100 = intensidade máxima que você percebe';
  let ckDraft = null;

  RS.views.moment = {
    title: 'Meu momento', nav: 'momento',
    render: ({ id }) => {
      if (id) { if (!ckDraft || ckDraft.id !== id) { const ex = RS.store.checkins().find((c) => c.id === id); ckDraft = ex ? JSON.parse(JSON.stringify(ex)) : blankCheckin(); } }
      else if (!ckDraft || RS.store.checkins().some((c) => c.id === ckDraft.id)) ckDraft = blankCheckin();
      const c = ckDraft;
      const editing = !!id;
      const list = RS.store.checkins().slice().sort((a, b) => new Date(b.when) - new Date(a.when)).slice(0, 14);
      const rem = RS.store.session.data.settings.reminder;
      return `
        <h1>Meu momento</h1>
        <p class="muted">Um registro rápido de como você está. Use quando quiser; não há dias “perdidos”.</p>
        <form class="card" id="ck">
          <fieldset><legend>Como você está agora, de forma geral?</legend>
            <div class="chips">${C.MOODS.map((m) => `<button type="button" class="chip" data-mood="${m.v}" aria-pressed="${c.humor === m.v}">${m.label}</button>`).join('')}</div></fieldset>
          <fieldset><legend>Quais emoções estão presentes? <span class="hint" style="display:inline">(opcional)</span></legend>
            <div class="chips">${[...new Set([...C.EMOTIONS, ...c.emocoes.map((e) => e.nome)])].map((n) => `<button type="button" class="chip" data-emo="${esc(n)}" aria-pressed="${c.emocoes.some((e) => e.nome === n)}">${esc(n)}</button>`).join('')}</div>
            <div class="btn-row mt"><label for="ck-outra" class="sr-only">Outra emoção</label>
              <input id="ck-outra" type="text" placeholder="Outra emoção" maxlength="30" style="max-width:240px">
              <button type="button" class="btn secondary small" id="ck-add">Adicionar</button></div>
            <label class="check mt"><input type="checkbox" id="ck-nao" ${c.naoIdentifica ? 'checked' : ''}> <span>Não consigo identificar o que estou sentindo</span></label>
            ${c.naoIdentifica ? '<p class="muted">Tudo bem. Nem sempre é fácil dar nome ao que sentimos. Se quiser, descreva abaixo como está, do seu jeito.</p>' : ''}
          </fieldset>
          ${c.emocoes.length ? `<p class="label">Intensidade de cada emoção<span class="hint">${SCALE_HINT}</span></p>` : ''}
          <div id="ints">${c.emocoes.map((e, i) => `<div class="emo-int"><span class="name">${esc(e.nome)}</span>
            <div class="range-row"><input type="range" min="0" max="100" step="5" value="${e.intensidade}" data-i="${i}" id="ck-${i}" aria-label="Intensidade de ${esc(e.nome)}" aria-valuetext="${e.intensidade} de 100"><span class="val" data-out="${i}">${e.intensidade}/100</span></div></div>`).join('')}</div>
          <div class="field"><label for="ck-contrib">O que você acredita que contribuiu para se sentir assim hoje? <span class="hint" style="display:inline">(opcional)</span></label><textarea id="ck-contrib" name="contribuiu">${esc(c.contribuiu || '')}</textarea></div>
          <div class="field"><label for="ck-notas">Notas <span class="hint" style="display:inline">(opcional)</span></label><textarea id="ck-notas" name="notas">${esc(c.notas)}</textarea></div>
          <details><summary>Data e hora</summary><div class="field"><label for="ck-when">Quando</label><input id="ck-when" type="datetime-local" value="${RS.toLocalInput(c.when)}"></div></details>
          <div class="btn-row">
            <button class="btn" type="submit">${editing ? 'Salvar alterações' : 'Salvar momento'}</button>
            ${editing ? `<a class="btn secondary" href="#/momento">Cancelar</a><button type="button" class="btn ghost" id="ck-del" style="color:var(--perigo)">Excluir</button>` : ''}
          </div>
        </form>
        <p class="muted">${rem.enabled ? `Lembrete ativo às ${esc(rem.time)}.` : 'Lembretes estão desativados.'} <a href="#/perfil#lembretes">Configurar lembretes</a></p>
        <h2>Momentos anteriores</h2>
        ${list.length ? `<div class="list">${list.map((x) => `<a class="item" href="#/momento/${x.id}"><div class="meta"><span>${fmtDateTime(x.when)}</span>${x.humor ? `<span class="badge">${esc(moodLabel(x.humor))}</span>` : ''}${x.demo ? '<span class="badge brief">Exemplo</span>' : ''}</div>
          <div class="text">${x.emocoes.length ? x.emocoes.map((e) => `${esc(e.nome)} ${e.intensidade}`).join(' · ') : `<span class="muted">${x.naoIdentifica ? 'Não consegui identificar o que sentia' : 'Sem emoções marcadas'}</span>`}</div>
          ${x.notas ? `<div class="muted">${esc(truncate(x.notas, 120))}</div>` : ''}</a>`).join('')}</div>` : '<div class="empty">Seus check-ins aparecerão aqui.</div>'}`;
    },
    mount: (root, { id }) => {
      const c = ckDraft;
      const f = root.querySelector('#ck');
      f.addEventListener('click', (e) => {
        const m = e.target.closest('[data-mood]');
        if (m) { c.humor = c.humor === +m.dataset.mood ? null : +m.dataset.mood; RS.app.render(); return; }
        const em = e.target.closest('[data-emo]');
        if (em) {
          const i = c.emocoes.findIndex((x) => x.nome === em.dataset.emo);
          if (i >= 0) c.emocoes.splice(i, 1); else c.emocoes.push({ nome: em.dataset.emo, intensidade: 50 });
          RS.app.render();
          return;
        }
        if (e.target.id === 'ck-add') addCustom();
      });
      const outra = root.querySelector('#ck-outra');
      const addCustom = () => {
        const v = outra.value.trim();
        if (!v) return;
        const name = v.charAt(0).toUpperCase() + v.slice(1);
        if (!c.emocoes.some((x) => x.nome.toLowerCase() === name.toLowerCase())) c.emocoes.push({ nome: name, intensidade: 50 });
        RS.app.render();
      };
      outra.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });
      f.addEventListener('change', (e) => { if (e.target.id === 'ck-nao') { c.naoIdentifica = e.target.checked; RS.app.render(); } });
      f.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset.i != null) {
          c.emocoes[+t.dataset.i].intensidade = +t.value;
          t.setAttribute('aria-valuetext', `${t.value} de 100`);
          root.querySelector(`[data-out="${t.dataset.i}"]`).textContent = `${t.value}/100`;
        } else if (t.name === 'notas') c.notas = t.value;
        else if (t.name === 'contribuiu') c.contribuiu = t.value;
        else if (t.id === 'ck-when' && t.value) c.when = new Date(t.value).toISOString();
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!c.humor && !c.emocoes.length && !c.naoIdentifica && !c.notas.trim() && !(c.contribuiu || '').trim()) { RS.toast('Escolha como está, marque uma emoção ou escreva algo para salvar.'); return; }
        RS.store.upsertCheckin(c);
        ckDraft = null;
        RS.toast(id ? 'Momento atualizado.' : 'Momento registrado. Obrigado por cuidar de você.');
        if (id) location.hash = '#/momento'; else RS.app.render();
      });
      const del = root.querySelector('#ck-del');
      if (del) del.addEventListener('click', async () => {
        if (!(await RS.confirmDialog('Excluir check-in?', 'Este registro será apagado de forma definitiva.', 'Excluir', true))) return;
        RS.store.deleteCheckin(id); ckDraft = null; RS.toast('Check-in excluído.'); location.hash = '#/momento';
      });
    },
  };

  /* ---------------- Outras perspectivas ---------------- */
  RS.views.perspectives = {
    title: 'Outras perspectivas', nav: 'perspectivas',
    render: () => {
      const pend = RS.store.records().filter((r) => r.status !== 'completo').sort((a, b) => new Date(b.when) - new Date(a.when));
      return `
        <h1>Outras perspectivas</h1>
        <p>Pensamentos automáticos são interpretações que podem ou não corresponder aos fatos. Aqui você pode olhar para eles com calma, por outros ângulos, e construir uma compreensão mais equilibrada com as suas palavras.</p>
        <div class="card soft"><p class="mb0">${esc(C.PRINCIPLE)}</p></div>
        <section class="card">
          <h2>Registros aguardando reflexão</h2>
          ${pend.length ? pend.slice(0, 10).map((r) => `
            <div class="item"><div class="meta"><span>${fmtDateTime(r.when)}</span>${RS.recordUtil.statusBadge(r.status)}</div>
              <div class="text">${esc(truncate(RS.recordUtil.firstThought(r) || r.situacao || 'Registro iniciado', 140))}</div>
              <div class="btn-row mt"><a class="btn small" href="#/registro/${r.id}/${r.status === 'rascunho' && (r.step || 1) < 7 ? r.step || 1 : 7}">Refletir quando quiser</a></div></div>`).join('')
            : `<div class="empty">Nenhum registro aguardando reflexão. <a href="#/registro/novo/1">Registrar um pensamento</a></div>`}
        </section>
        <section class="card">
          <h2>Perguntas para olhar de outro jeito</h2>
          <p class="muted">Poucas perguntas por vez, no seu ritmo. Use as que fizerem sentido; não é preciso responder todas.</p>
          <div id="soc"></div>
        </section>
        <section class="card">
          <h2>Possíveis padrões de pensamento</h2>
          <p class="muted">São formas comuns de interpretar situações, e todo mundo tem às vezes. Servem como apoio para reflexão, nunca como rótulo ou diagnóstico.</p>
          ${C.DISTORTIONS.map((d) => `<details><summary>${esc(d.name)}</summary><p>${esc(d.desc)}</p><p class="muted">Exemplo: ${esc(d.ex)}</p></details>`).join('')}
        </section>`;
    },
    mount: (root) => {
      let i = 0;
      const Q = C.SOCRATIC;
      const box = root.querySelector('#soc');
      const draw = () => {
        box.innerHTML = `<ul id="soc-list" tabindex="-1">${[Q[i % Q.length], Q[(i + 1) % Q.length]].map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
          <button type="button" class="btn secondary small" id="soc-more">Ver outras perguntas</button>`;
      };
      box.addEventListener('click', (e) => { if (e.target.id === 'soc-more') { i = (i + 2) % Q.length; draw(); box.querySelector('#soc-list').focus(); } });
      draw();
    },
  };

  /* ---------------- Aprender ---------------- */
  const reviewNote = '<p class="card warn">Conteúdo provisório, pendente de revisão por profissional habilitado antes do lançamento.</p>';
  RS.views.learn = {
    title: 'Aprender', nav: 'aprender',
    render: () => `
      <h1>Aprender para transformar</h1>
      <p class="muted">Conteúdos curtos sobre a base do método, escritos sob a responsabilidade de ${esc(C.AUTHOR.name)}, psicóloga (${C.AUTHOR.crp}).</p>
      <div class="learn-grid">${C.LEARN.map((a) => `<a class="learn-card" href="#/aprender/${a.id}"><div class="card"><h2>${esc(a.title)}</h2><p class="muted mb0">${esc(a.summary)}</p></div></a>`).join('')}</div>`,
  };
  RS.views.article = {
    title: 'Aprender', nav: 'aprender',
    render: ({ id }) => {
      const a = C.LEARN.find((x) => x.id === id);
      if (!a) return '<div class="empty">Conteúdo não encontrado.</div>';
      const body = a.body.replace('{DISTORTIONS}', `<ul>${C.DISTORTIONS.map((d) => `<li><strong>${esc(d.name)}:</strong> ${esc(d.desc)} <span class="muted">${esc(d.ex)}</span></li>`).join('')}</ul>`);
      return `<a class="btn ghost" href="#/aprender">${RS.icon('back')} Aprender</a><article class="card article"><h1>${esc(a.title)}</h1>${body}</article>${reviewNote}`;
    },
  };

  /* ---------------- Ajuda ---------------- */
  RS.views.help = {
    title: 'Ajuda', nav: '',
    render: () => `
      <h1>Ajuda</h1>
      <section class="card danger"><h2>Apoio em crises</h2>${C.CRISIS}</section>
      <section class="card"><h2>Sobre o ReSignifica</h2><ul class="notice-list">${C.NOTICES.map((n) => `<li>${n}</li>`).join('')}</ul></section>
      <section class="card"><h2>Como usar</h2>
        <ul><li><strong>Meu momento:</strong> check-in rápido de como você está.</li>
        <li><strong>Registrar pensamento:</strong> 9 etapas guiadas, todas opcionais a partir da terceira. Você pode parar a qualquer momento; o rascunho é salvo automaticamente.</li>
        <li><strong>Outras perspectivas:</strong> perguntas para refletir sobre registros ainda sem reflexão.</li>
        <li><strong>Minha jornada:</strong> calendário e visão geral dos seus registros.</li>
        <li><strong>Compartilhar com meu terapeuta:</strong> gere um PDF com o que você escolher. Nada é enviado sem a sua ação.</li></ul></section>`,
  };

  RS.views.privacy = { title: 'Política de Privacidade', nav: 'perfil', render: () => `<div class="card article"><h1>Política de Privacidade</h1>${RS.views.privacyText()}</div>` };
  RS.views.terms = { title: 'Termos de Uso', nav: 'perfil', render: () => `<div class="card article"><h1>Termos de Uso</h1>${C.TERMS}</div>` };
  RS.views.about = { title: 'Sobre o ReSignifica', nav: 'sobre', render: () => `<div class="card article"><h1>Sobre o ReSignifica</h1><p><strong>Um pensamento de cada vez.</strong></p></div><div class="card soft">${RS.authorCard()}<p class="muted mt mb0">O ReSignifica foi idealizado por Rosália, que é responsável por todo o conteúdo psicológico do app. O app não oferece atendimento: para isso, procure um profissional de sua escolha.</p></div><div class="card article">${C.ABOUT}</div>` };
})(window.RS);
