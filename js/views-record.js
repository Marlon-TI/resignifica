/* Meus pensamentos: lista, detalhe e fluxo guiado de registro e reestruturação (7 etapas) */
'use strict';
(function (RS) {
  const { esc, fmtDateTime, truncate } = RS;
  const C = RS.content;

  const STATUS = { rascunho: ['Rascunho', 'draft'], breve: ['Registro breve', 'brief'], completo: ['Com reflexão', ''] };
  const statusBadge = (s) => { const [l, c] = STATUS[s] || STATUS.rascunho; return `<span class="badge ${c}">${l}</span>`; };
  const firstThought = (r) => (r.pensamentos || []).find((p) => p && p.trim()) || '';
  const hasReflection = (r) => !!(r.evidFavor || r.evidContra || r.outrasExplic || r.alguemQuerido || r.alternativo).toString().trim();
  const hasCore = (r) => !!((r.situacao || '').trim() || firstThought(r).trim());

  RS.recordUtil = { statusBadge, firstThought, hasReflection, STATUS };

  /* Item de lista reutilizável */
  RS.recordItem = (r) => `
    <a class="item" href="#/pensamentos/${r.id}">
      <div class="meta"><span>${fmtDateTime(r.when)}</span>${statusBadge(r.status)}
        ${(r.emocoes || []).slice(0, 3).map((e) => `<span>${esc(e.nome)} ${e.antes}</span>`).join(' · ')}</div>
      <div class="text">${esc(truncate(firstThought(r) || r.situacao || 'Sem texto ainda', 140))}</div>
      ${r.situacao && firstThought(r) ? `<div class="muted">${esc(truncate(r.situacao, 110))}</div>` : ''}
    </a>`;

  /* ---------------- Lista ---------------- */
  RS.views.thoughts = {
    title: 'Meus pensamentos', nav: 'pensamentos',
    render: () => {
      const emos = [...new Set(RS.store.records().flatMap((r) => (r.emocoes || []).map((e) => e.nome)))].sort();
      return `
      <div class="btn-row between"><h1 class="mb0">Meus pensamentos</h1><a class="btn" href="#/registro/novo/1">${RS.icon('plus')} Novo registro</a></div>
      <p class="muted mt">Registros breves têm situação, pensamento e emoções. Registros com reflexão incluem a reestruturação.</p>
      <form class="filters" id="flt" role="search" aria-label="Filtrar registros">
        <div class="wide"><label for="q" class="sr-only">Palavras-chave</label><input id="q" name="q" type="search" placeholder="Buscar por palavras-chave"></div>
        <div><label for="emo" class="sr-only">Emoção</label><select id="emo" name="emo"><option value="">Todas as emoções</option>${emos.map((e) => `<option>${esc(e)}</option>`).join('')}</select></div>
        <div><label for="from" class="sr-only">De</label><input id="from" name="from" type="date" aria-label="Data inicial"></div>
        <div><label for="to" class="sr-only">Até</label><input id="to" name="to" type="date" aria-label="Data final"></div>
        <div class="wide"><div class="seg" role="group" aria-label="Tipo de registro">
          <button type="button" data-st="" aria-pressed="true">Todos</button>
          <button type="button" data-st="completo" aria-pressed="false">Com reflexão</button>
          <button type="button" data-st="breve" aria-pressed="false">Breves</button>
          <button type="button" data-st="rascunho" aria-pressed="false">Rascunhos</button></div></div>
      </form>
      <div id="res"></div>`;
    },
    mount: (root) => {
      const f = root.querySelector('#flt');
      let st = '';
      const run = () => {
        const q = f.q.value.trim().toLowerCase();
        const from = f.from.value ? RS.startOfDay(f.from.value + 'T00:00') : null;
        const to = f.to.value ? RS.endOfDay(f.to.value + 'T00:00') : null;
        const list = RS.store.records().filter((r) => {
          if (st && r.status !== st) return false;
          if (f.emo.value && !(r.emocoes || []).some((e) => e.nome === f.emo.value)) return false;
          const w = new Date(r.when);
          if (from && w < from) return false;
          if (to && w > to) return false;
          if (q) {
            const hay = [r.situacao, r.contexto, ...(r.pensamentos || []), r.sensacoes, r.comportamento, r.evidFavor, r.evidContra,
              r.outrasExplic, r.alguemQuerido, r.alternativo, r.notas, ...(r.emocoes || []).map((e) => e.nome)].join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        }).sort((a, b) => new Date(b.when) - new Date(a.when));
        const total = RS.store.records().length;
        root.querySelector('#res').innerHTML = list.length
          ? `<p class="muted" aria-live="polite">${list.length} registro(s)</p><div class="list">${list.map(RS.recordItem).join('')}</div>`
          : `<div class="empty">${total ? 'Nenhum registro encontrado com esses filtros.' : 'Você ainda não tem registros. Quando quiser, comece pelo botão “Novo registro”.'}</div>`;
      };
      f.addEventListener('input', run);
      f.addEventListener('submit', (e) => e.preventDefault());
      f.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => {
        st = b.dataset.st;
        f.querySelectorAll('[data-st]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        run();
      }));
      run();
    },
  };

  /* ---------------- Detalhe ---------------- */
  const block = (label, val) => (val && String(val).trim() ? `<dt>${label}</dt><dd>${esc(val)}</dd>` : '');
  RS.recordDetailHTML = (r) => {
    const distNames = (r.distorcoes || []).map((id) => (C.DISTORTIONS.find((d) => d.id === id) || {}).name).filter(Boolean);
    const thoughts = (r.pensamentos || []).filter((p) => p && p.trim());
    return `
      <dl class="kv">
        <dt>Quando</dt><dd>${fmtDateTime(r.when)}</dd>
        ${block('Situação', r.situacao)}${block('Contexto', r.contexto)}
        ${thoughts.length ? `<dt>Pensamento${thoughts.length > 1 ? 's' : ''} automático${thoughts.length > 1 ? 's' : ''}</dt><dd>${thoughts.map((t) => `• ${esc(t)}`).join('\n')}</dd>` : ''}
        ${(r.emocoes || []).length ? `<dt>Emoções e intensidade</dt><dd>${r.emocoes.map((e) => `${esc(e.nome)}: ${e.antes}/100${e.depois != null ? ` → ${e.depois}/100 após a reflexão` : ''}`).join('\n')}</dd>` : ''}
        ${block('Sensações físicas', r.sensacoes)}${block('Comportamento / reação', r.comportamento)}
        ${block('Evidências a favor do pensamento', r.evidFavor)}${block('Evidências contrárias ou outras possibilidades', r.evidContra)}
        ${block('Outras explicações', r.outrasExplic)}${block('O que eu diria a alguém querido', r.alguemQuerido)}
        ${distNames.length ? `<dt>Possíveis padrões que identifiquei</dt><dd>${esc(distNames.join(', '))}</dd>` : ''}
        ${block('Pensamento alternativo', r.alternativo)}${block('Notas', r.notas)}
      </dl>`;
  };

  RS.views.thoughtDetail = {
    title: 'Registro', nav: 'pensamentos',
    render: ({ id }) => {
      const r = RS.store.getRecord(id);
      if (!r) return `<div class="empty">Registro não encontrado. <a href="#/pensamentos">Voltar</a></div>`;
      return `
        <a class="btn ghost" href="#/pensamentos">${RS.icon('back')} Meus pensamentos</a>
        <div class="card">
          <div class="btn-row between"><h1 class="mb0">Registro</h1>${statusBadge(r.status)}</div>
          <p class="muted">Atualizado em ${fmtDateTime(r.updatedAt)}</p>
          ${RS.recordDetailHTML(r)}
          <div class="btn-row">
            ${r.status !== 'completo' ? `<a class="btn" href="#/registro/${r.id}/${r.status === 'rascunho' ? r.step || 1 : 4}">${r.status === 'rascunho' ? 'Continuar registro' : 'Refletir sobre este registro'}</a>` : ''}
            <a class="btn secondary" href="#/registro/${r.id}/1">Editar</a>
            <button class="btn ghost" id="del" style="color:var(--perigo)">Excluir</button>
          </div>
        </div>`;
    },
    mount: (root, { id }) => {
      const b = root.querySelector('#del');
      if (b) b.addEventListener('click', async () => {
        if (!(await RS.confirmDialog('Excluir registro?', 'Este registro será apagado de forma definitiva.', 'Excluir', true))) return;
        RS.store.deleteRecord(id); RS.toast('Registro excluído.'); location.hash = '#/pensamentos';
      });
    },
  };

  /* ---------------- Fluxo guiado ---------------- */
  let pending = null; // registro novo, ainda não salvo (só passa a existir quando algo é digitado)

  const getWorking = (id) => {
    if (id === 'novo') { pending = RS.store.newRecord(); return pending; }
    if (pending && pending.id === id) return pending;
    return RS.store.getRecord(id);
  };

  const touch = (r) => {
    if (r.persisted === false) { r.persisted = true; if (pending === r) pending = null; }
    RS.store.upsertRecord(r);
  };

  const ta = (r, f, label, hint, ph, req) => `
    <div class="field"><label for="f-${f}">${label}${req ? '' : ' <span class="hint" style="display:inline">(opcional)</span>'}${hint ? `<span class="hint">${hint}</span>` : ''}</label>
    <textarea id="f-${f}" data-f="${f}" placeholder="${esc(ph || '')}">${esc(r[f])}</textarea></div>`;

  const rangeRow = (id, label, val, key, idx) => `
    <div class="range-row"><input type="range" min="0" max="100" step="5" value="${val}" id="${id}" data-${key}="${idx}" aria-label="${esc(label)}" aria-valuetext="${val} de 100">
    <span class="val" data-out="${id}">${val}/100</span></div>`;

  const STEP_RENDER = {
    1: (r) => `
      <p class="example">Exemplo: “Enviei uma mensagem e não recebi resposta.”</p>
      <div class="field"><label for="f-when">Quando aconteceu?</label><input type="datetime-local" id="f-when" data-when value="${RS.toLocalInput(r.when)}"></div>
      ${ta(r, 'situacao', 'O que aconteceu?', 'Descreva a situação como uma câmera veria: fatos, sem julgamentos.', 'Ex.: Enviei uma mensagem para uma amiga e ela não respondeu.', true)}
      ${ta(r, 'contexto', 'Contexto', 'Onde você estava, com quem, o que vinha acontecendo.', '')}`,
    2: (r) => `
      <p class="example">Exemplo: “Fiz algo errado.”</p>
      <p><strong>O que passou pela sua cabeça?</strong><span class="hint">Escreva com as palavras que vieram, mesmo que pareçam exageradas.</span></p>
      <div id="thoughts">${(r.pensamentos.length ? r.pensamentos : ['']).map((p, i) => `
        <div class="multi-thought"><label class="sr-only" for="pt-${i}">Pensamento ${i + 1}</label>
        <textarea id="pt-${i}" data-pt="${i}" placeholder="${i ? 'Outro pensamento' : 'Ex.: Fiz algo errado.'}">${esc(p)}</textarea>
        ${i ? `<button type="button" class="btn ghost small" data-rmpt="${i}" aria-label="Remover pensamento ${i + 1}">Remover</button>` : ''}</div>`).join('')}</div>
      <button type="button" class="btn secondary small" id="addpt">${RS.icon('plus')} Adicionar outro pensamento</button>`,
    3: (r) => `
      <p class="example">Exemplo: ansiedade 70/100.</p>
      <fieldset><legend>Quais emoções você sentiu?</legend>
        <div class="chips">${[...new Set([...C.EMOTIONS, ...r.emocoes.map((e) => e.nome)])].map((n) => `
          <button type="button" class="chip" data-emo="${esc(n)}" aria-pressed="${r.emocoes.some((e) => e.nome === n)}">${esc(n)}</button>`).join('')}</div>
        <div class="btn-row mt"><label for="emo-outra" class="sr-only">Outra emoção</label>
          <input id="emo-outra" type="text" placeholder="Outra emoção" maxlength="30" style="max-width:240px">
          <button type="button" class="btn secondary small" id="emo-add">Adicionar</button></div>
      </fieldset>
      <div id="emo-ints">${r.emocoes.length ? '<p class="label">Intensidade de cada emoção (0 = nada, 100 = máxima)</p>' : ''}
        ${r.emocoes.map((e, i) => `<div class="emo-int"><span class="name">${esc(e.nome)}</span>${rangeRow('ea-' + i, 'Intensidade de ' + e.nome, e.antes, 'ea', i)}</div>`).join('')}</div>
      ${ta(r, 'sensacoes', 'Sensações físicas', 'Ex.: aperto no peito, coração acelerado.', '')}
      ${ta(r, 'comportamento', 'Comportamento ou reação', 'O que você fez ou teve vontade de fazer?', '')}`,
    4: (r) => `
      <p>Agora, com calma, vamos olhar para o pensamento <strong>“${esc(truncate(firstThought(r) || '…', 120))}”</strong> de outros ângulos. Responda só o que fizer sentido; você pode pular qualquer pergunta.</p>
      ${ta(r, 'evidFavor', 'Que evidências apoiam esse pensamento?', 'Fatos, não sensações.', '')}
      ${ta(r, 'evidContra', 'Que evidências não se encaixam nele, ou que outras possibilidades existem?', '', 'Ex.: Ela costuma demorar para responder quando está trabalhando.')}
      ${ta(r, 'outrasExplic', 'Que outras explicações poderiam existir?', '', 'Ex.: Ela pode estar ocupada, sem bateria, ou não viu a mensagem.')}
      ${ta(r, 'alguemQuerido', 'O que você diria a alguém querido que estivesse pensando isso?', '', '')}
      <details><summary>Perguntas que podem ajudar</summary>
        ${C.SOCRATIC.map((l, i) => `<p class="mb0"><strong>${i + 1}. ${esc(l.level)}</strong></p><ul>${l.qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>`).join('')}
      </details>
      <details><summary>Algum destes padrões aparece aqui? (opcional)</summary>
        <p class="muted">Todo mundo tem esses padrões às vezes. Marque só se você achar que faz sentido; o app não identifica nada automaticamente.</p>
        ${C.DISTORTIONS.map((d) => `<label class="check"><input type="checkbox" data-dist="${d.id}" ${r.distorcoes.includes(d.id) ? 'checked' : ''}>
          <span><strong>${esc(d.name)}</strong>: ${esc(d.desc)} <span class="muted">${esc(d.ex)}</span></span></label>`).join('')}
      </details>`,
    5: (r) => `
      <p class="example">Exemplo: “Não receber resposta não prova que fiz algo errado; existem outras explicações.”</p>
      <p>Considerando o que você refletiu, como você poderia ver essa situação de um jeito mais equilibrado? <strong>Não precisa ser positivo</strong>: o objetivo é uma visão mais completa, com as suas palavras.</p>
      ${r.evidContra || r.outrasExplic ? `<div class="card soft"><p class="label">O que você escreveu na reflexão</p>${r.evidContra ? `<p>${esc(r.evidContra)}</p>` : ''}${r.outrasExplic ? `<p class="mb0">${esc(r.outrasExplic)}</p>` : ''}</div>` : ''}
      ${ta(r, 'alternativo', 'Pensamento alternativo', '', '')}`,
    6: (r) => `
      <p>Depois de refletir, como estão as emoções agora? Esta etapa é opcional.</p>
      <p class="muted">Tudo bem se a intensidade não mudar. Às vezes a emoção leva tempo, e registrar já é um passo importante.</p>
      ${r.emocoes.length ? r.emocoes.map((e, i) => `<div class="emo-int"><span class="name">${esc(e.nome)}</span> <span class="muted">(antes: ${e.antes}/100)</span>
        ${e.depois == null ? `<div><button type="button" class="btn secondary small mt" data-rate="${i}">Avaliar agora</button></div>` : rangeRow('ed-' + i, 'Intensidade de ' + e.nome + ' agora', e.depois, 'ed', i)}</div>`).join('')
        : '<div class="empty">Nenhuma emoção registrada na etapa 3.</div>'}`,
    7: (r) => `
      <p>Confira seu registro. Você pode salvar agora ou continuar depois.</p>
      <div class="card">${RS.recordDetailHTML(r)}</div>
      ${ta(r, 'notas', 'Notas', 'Algo mais que queira lembrar?', '')}`,
  };

  RS.views.wizard = {
    title: 'Registrar pensamento', nav: 'pensamentos',
    render: ({ id, step }) => {
      const r = getWorking(id);
      if (!r) return `<div class="empty">Registro não encontrado. <a href="#/pensamentos">Voltar</a></div>`;
      const n = Math.min(7, Math.max(1, +step || 1));
      const s = C.STEPS[n - 1];
      return `
        <h1 class="sr-only">Registrar pensamento</h1>
        <nav class="steps" aria-label="Etapas">${C.STEPS.map((x) => `<span class="${x.n < n ? 'done' : x.n === n ? 'now' : ''}" title="${x.n}. ${x.title}"></span>`).join('')}</nav>
        <div class="step-label">Etapa ${n} de 7</div>
        <h2>${n}. ${s.title}</h2>
        <form id="wz" autocomplete="off">${STEP_RENDER[n](r)}</form>
        <p class="muted" id="autosave" aria-live="polite">${r.persisted === false ? 'O rascunho é salvo automaticamente enquanto você escreve.' : 'Rascunho salvo automaticamente.'}</p>
        <div class="wizard-actions">
          <div class="btn-row">${n > 1 ? `<button type="button" class="btn secondary" data-go="${n - 1}">Voltar</button>` : `<a class="btn secondary" href="#/pensamentos">Cancelar</a>`}</div>
          <div class="btn-row">
            ${n < 7 ? `<button type="button" class="btn ghost" id="later">Continuar depois</button>` : ''}
            ${n === 3 ? `<button type="button" class="btn secondary" id="brief">Salvar sem reflexão</button>` : ''}
            ${n >= 4 && n <= 6 ? `<button type="button" class="btn secondary" data-go="${n + 1}">Pular etapa</button>` : ''}
            ${n < 7 ? `<button type="button" class="btn" data-go="${n + 1}">Continuar</button>` : `
              <button type="button" class="btn secondary" id="later">Salvar como rascunho</button>
              <button type="button" class="btn" id="finish">Salvar registro</button>`}
          </div>
        </div>`;
    },
    mount: (root, { id, step }) => {
      const r = id === 'novo' ? pending : getWorking(id);
      if (!r) return;
      const n = Math.min(7, Math.max(1, +step || 1));
      if (id === 'novo') history.replaceState(null, '', `#/registro/${r.id}/${n}`);
      const form = root.querySelector('#wz');
      const status = root.querySelector('#autosave');
      const changed = () => { if (r.status === 'rascunho') r.step = n; touch(r); status.textContent = 'Rascunho salvo automaticamente.'; };
      const rerender = () => RS.app.render();

      form.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset.f) { r[t.dataset.f] = t.value; changed(); }
        else if (t.hasAttribute('data-when')) { if (t.value) { r.when = new Date(t.value).toISOString(); changed(); } }
        else if (t.dataset.pt != null) { r.pensamentos[+t.dataset.pt] = t.value; changed(); }
        else if (t.dataset.ea != null || t.dataset.ed != null) {
          const i = +(t.dataset.ea != null ? t.dataset.ea : t.dataset.ed);
          r.emocoes[i][t.dataset.ea != null ? 'antes' : 'depois'] = +t.value;
          t.setAttribute('aria-valuetext', `${t.value} de 100`);
          root.querySelector(`[data-out="${t.id}"]`).textContent = `${t.value}/100`;
          changed();
        } else if (t.dataset.dist) {
          r.distorcoes = r.distorcoes.filter((x) => x !== t.dataset.dist);
          if (t.checked) r.distorcoes.push(t.dataset.dist);
          changed();
        }
      });
      form.addEventListener('submit', (e) => e.preventDefault());

      form.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-emo]');
        if (chip) {
          const name = chip.dataset.emo;
          const i = r.emocoes.findIndex((x) => x.nome === name);
          if (i >= 0) r.emocoes.splice(i, 1); else r.emocoes.push({ nome: name, antes: 50, depois: null });
          changed(); rerender(); focusAfter(`[data-emo="${cssq(name)}"]`); return;
        }
        if (e.target.id === 'emo-add') { addCustom(); return; }
        if (e.target.id === 'addpt') { r.pensamentos.push(''); changed(); rerender(); focusAfter(`#pt-${r.pensamentos.length - 1}`); return; }
        const rm = e.target.closest('[data-rmpt]');
        if (rm) { r.pensamentos.splice(+rm.dataset.rmpt, 1); changed(); rerender(); return; }
        const rate = e.target.closest('[data-rate]');
        if (rate) { const em = r.emocoes[+rate.dataset.rate]; em.depois = em.antes; changed(); rerender(); focusAfter(`#ed-${rate.dataset.rate}`); }
      });
      const outra = root.querySelector('#emo-outra');
      const addCustom = () => {
        const v = outra.value.trim();
        if (!v) return;
        const name = v.charAt(0).toUpperCase() + v.slice(1);
        if (!r.emocoes.some((x) => x.nome.toLowerCase() === name.toLowerCase())) r.emocoes.push({ nome: name, antes: 50, depois: null });
        changed(); rerender();
      };
      if (outra) outra.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });

      root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
        if (r.persisted !== false && r.status === 'rascunho') { r.step = +b.dataset.go; RS.store.upsertRecord(r); }
        location.hash = `#/registro/${r.id}/${b.dataset.go}`;
      }));

      const finishWith = (st, msg) => {
        if (st !== 'rascunho' && !hasCore(r)) { RS.toast('Escreva ao menos a situação ou o pensamento para salvar o registro.'); return; }
        if (st === 'rascunho' && r.persisted === false && !hasCore(r)) { pending = null; location.hash = '#/pensamentos'; return; }
        r.status = st; if (st === 'rascunho') r.step = n;
        touch(r); RS.store.saveNow(); RS.toast(msg);
        location.hash = st === 'rascunho' ? '#/pensamentos' : `#/pensamentos/${r.id}`;
      };
      root.querySelectorAll('#later').forEach((b) => b.addEventListener('click', () => finishWith(r.status === 'rascunho' || r.persisted === false ? 'rascunho' : r.status, 'Salvo. Você pode continuar quando quiser.')));
      const br = root.querySelector('#brief');
      if (br) br.addEventListener('click', () => finishWith('breve', 'Registro salvo. Você pode refletir sobre ele depois em “Outras perspectivas”.'));
      const fin = root.querySelector('#finish');
      if (fin) fin.addEventListener('click', () => finishWith(hasReflection(r) ? 'completo' : 'breve', 'Registro salvo. Registrar já é um passo.'));
    },
  };

  const cssq = (s) => String(s).replace(/"/g, '\\"');
  const focusAfter = (sel) => setTimeout(() => { const el = document.querySelector(sel); if (el) el.focus(); }, 0);
})(window.RS);
