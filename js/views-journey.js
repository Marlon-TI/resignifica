/* Minha jornada: calendário, histórico e visualizações com cautela interpretativa */
'use strict';
(function (RS) {
  const { esc, fmtDateTime, truncate } = RS;
  const MIN_DATA = 3;
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const STOP = new Set(('que para com por uma umas uns como mais mas não nao sem sou ser está esta estou isso isto esse essa este ' +
    'ele ela eles elas meu minha meus minhas seu sua seus suas nos nós vou vai foi fui tem ter tenho tinha muito muita ' +
    'quando onde porque pois também tambem ainda depois antes sempre nunca nada tudo todo toda todos todas algo alguém alguem ' +
    'mesmo mesma assim então entao aqui agora fazer feito fiz pode posso vez vezes dele dela deles delas pela pelo pelas pelos ' +
    'num numa numas nuns lhe lhes isso aquilo aquele aquela qual quais quem cada outro outra outros outras sobre entre até ate').split(' '));

  /* Estatísticas reutilizadas pelo relatório */
  RS.stats = {
    emotionFreq(records, checkins) {
      const m = {};
      const add = (nome, v) => { const x = m[nome] || (m[nome] = { nome, n: 0, sum: 0 }); x.n++; x.sum += v; };
      records.forEach((r) => (r.emocoes || []).forEach((e) => add(e.nome, e.antes)));
      (checkins || []).forEach((c) => c.emocoes.forEach((e) => add(e.nome, e.intensidade)));
      return Object.values(m).map((x) => ({ nome: x.nome, n: x.n, media: Math.round(x.sum / x.n) })).sort((a, b) => b.n - a.n || b.media - a.media);
    },
    beforeAfter(records) {
      const m = {};
      records.forEach((r) => (r.emocoes || []).forEach((e) => {
        if (e.depois == null) return;
        const x = m[e.nome] || (m[e.nome] = { nome: e.nome, n: 0, a: 0, d: 0 });
        x.n++; x.a += e.antes; x.d += e.depois;
      }));
      return Object.values(m).map((x) => ({ nome: x.nome, n: x.n, antes: Math.round(x.a / x.n), depois: Math.round(x.d / x.n) })).sort((a, b) => b.n - a.n);
    },
    recurringWords(records) {
      const m = {};
      records.forEach((r) => {
        const seen = new Set();
        (r.pensamentos || []).join(' ').toLowerCase().normalize('NFC').split(/[^a-zà-ÿ]+/).forEach((w) => {
          if (w.length < 4 || STOP.has(w) || seen.has(w)) return;
          seen.add(w); m[w] = (m[w] || 0) + 1;
        });
      });
      return Object.entries(m).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10);
    },
    distortionFreq(records) {
      const m = {};
      records.forEach((r) => (r.distorcoes || []).forEach((id) => { m[id] = (m[id] || 0) + 1; }));
      return Object.entries(m).map(([id, n]) => ({ name: (RS.content.DISTORTIONS.find((d) => d.id === id) || {}).name || id, n })).sort((a, b) => b.n - a.n);
    },
  };

  const bars = (rows, max, cls = '') => `<div class="bars">${rows.map((r) => `
    <div class="bar"><span>${esc(r.label)}</span><span class="track" role="img" aria-label="${esc(r.label)}: ${r.value}${r.suffix || ''}"><span class="fill ${cls}" style="width:${Math.max(2, Math.round((r.value / max) * 100))}%"></span></span><span class="n">${r.value}${r.suffix || ''}</span></div>`).join('')}</div>`;

  let cal = null; let sel = null; let period = 30;

  RS.views.journey = {
    title: 'Minha jornada', nav: 'jornada',
    render: () => {
      const now = new Date();
      if (!cal) cal = { y: now.getFullYear(), m: now.getMonth() };
      const recs = RS.store.records().filter((r) => r.status !== 'rascunho');
      const cks = RS.store.checkins();

      /* Calendário */
      const byDay = {};
      recs.forEach((r) => { const k = RS.dayKey(r.when); (byDay[k] = byDay[k] || { r: 0, c: 0 }).r++; });
      cks.forEach((c) => { const k = RS.dayKey(c.when); (byDay[k] = byDay[k] || { r: 0, c: 0 }).c++; });
      const first = new Date(cal.y, cal.m, 1);
      const days = new Date(cal.y, cal.m + 1, 0).getDate();
      const today = RS.dayKey(now.toISOString());
      let cells = '';
      for (let i = 0; i < first.getDay(); i++) cells += '<button class="out" tabindex="-1" aria-hidden="true"></button>';
      for (let d = 1; d <= days; d++) {
        const k = `${cal.y}-${RS.pad(cal.m + 1)}-${RS.pad(d)}`;
        const x = byDay[k];
        const lbl = `${d} de ${MONTHS[cal.m]}${x ? `: ${x.r} registro(s), ${x.c} check-in(s)` : ''}`;
        cells += `<button type="button" data-day="${k}" class="${k === today ? 'today' : ''} ${k === sel ? 'sel' : ''}" aria-label="${lbl}" aria-pressed="${k === sel}">
          ${d}<span class="dots">${x && x.r ? '<i></i>' : ''}${x && x.c ? '<i class="c"></i>' : ''}</span></button>`;
      }

      /* Período para visualizações */
      const from = period ? RS.daysAgo(period) : new Date(0);
      const pr = recs.filter((r) => new Date(r.when) >= from);
      const pc = cks.filter((c) => new Date(c.when) >= from);
      const total = pr.length + pc.length;
      const emo = RS.stats.emotionFreq(pr, pc);
      const ba = RS.stats.beforeAfter(pr);
      const words = RS.stats.recurringWords(pr);
      const dist = RS.stats.distortionFreq(pr);
      const completos = pr.filter((r) => r.status === 'completo').length;

      const selList = sel ? [
        ...recs.filter((r) => RS.dayKey(r.when) === sel).map((r) => ({ t: r.when, html: RS.recordItem(r) })),
        ...cks.filter((c) => RS.dayKey(c.when) === sel).map((c) => ({ t: c.when, html: `<a class="item" href="#/momento/${c.id}"><div class="meta"><span>${fmtDateTime(c.when)}</span><span class="badge">Meu momento</span></div><div class="text">${c.emocoes.map((e) => `${esc(e.nome)} ${e.intensidade}`).join(' · ') || esc((RS.content.MOODS.find((m) => m.v === c.humor) || {}).label || '')}</div>${c.notas ? `<div class="muted">${esc(truncate(c.notas, 100))}</div>` : ''}</a>` })),
      ].sort((a, b) => new Date(b.t) - new Date(a.t)) : [];

      return `
        <h1>Minha jornada</h1>
        <p class="muted">Uma visão dos seus registros ao longo do tempo.</p>
        <section class="card">
          <div class="btn-row between"><button type="button" class="btn secondary small" data-mo="-1" aria-label="Mês anterior">‹</button>
            <h2 class="mb0" style="text-transform:capitalize">${MONTHS[cal.m]} ${cal.y}</h2>
            <button type="button" class="btn secondary small" data-mo="1" aria-label="Próximo mês">›</button></div>
          <div class="legend mt"><span><i style="background:var(--link)"></i>Registro de pensamento</span><span><i style="background:var(--salvia)"></i>Meu momento</span></div>
          <div class="cal">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => `<div class="dow" aria-hidden="true">${d}</div>`).join('')}${cells}</div>
          ${sel ? `<h3 class="mt">${RS.fmtLong(sel + 'T12:00')}</h3>${selList.length ? selList.map((x) => x.html).join('') : '<p class="muted">Nenhum registro neste dia.</p>'}` : ''}
        </section>

        <div class="seg" role="group" aria-label="Período">
          <button type="button" data-p="7" aria-pressed="${period === 7}">Últimos 7 dias</button>
          <button type="button" data-p="30" aria-pressed="${period === 30}">Últimos 30 dias</button>
          <button type="button" data-p="0" aria-pressed="${period === 0}">Todo o histórico</button></div>

        <section class="card mt">
          <h2>${period === 7 ? 'Resumo da semana' : period === 30 ? 'Resumo do mês' : 'Resumo geral'}</h2>
          <div class="stat-row"><div class="stat"><b>${pr.length}</b><span>registros de pensamento</span></div>
            <div class="stat"><b>${completos}</b><span>com reflexão</span></div>
            <div class="stat"><b>${pc.length}</b><span>check-ins</span></div></div>
          ${total ? `<p>${summaryText(pr, pc, emo, period)}</p>` : '<p class="muted mb0">Ainda não há registros neste período.</p>'}
        </section>

        ${total < MIN_DATA ? `<div class="card soft"><p class="mb0">As visualizações aparecem quando houver pelo menos ${MIN_DATA} registros no período. Sem pressa: elas existem para ajudar a perceber padrões, não para cobrar frequência.</p></div>` : `
        <section class="card">
          <h2>Emoções mais frequentes</h2>
          <p class="muted">Quantas vezes cada emoção apareceu e a intensidade média registrada.</p>
          ${bars(emo.slice(0, 8).map((e) => ({ label: e.nome, value: e.n, suffix: '×' })), emo[0].n)}
          <p class="muted mb0">Intensidade média: ${emo.slice(0, 8).map((e) => `${esc(e.nome)} ${e.media}`).join(' · ')}</p>
        </section>
        <section class="card">
          <h2>Intensidade antes e depois da reflexão</h2>
          ${ba.reduce((s, x) => s + x.n, 0) >= MIN_DATA ? `
            <div class="legend"><span><i style="background:var(--salvia)"></i>Antes</span><span><i style="background:var(--link)"></i>Depois</span></div>
            ${ba.slice(0, 6).map((x) => `<p class="label mb0 mt">${esc(x.nome)} <span class="muted">(${x.n} registro${x.n > 1 ? 's' : ''})</span></p>
              ${bars([{ label: 'Antes', value: x.antes }], 100)}${bars([{ label: 'Depois', value: x.depois }], 100, 'after')}`).join('')}`
            : `<p class="muted">Aparece quando houver ao menos ${MIN_DATA} reavaliações (etapa 6 do registro).</p>`}
          <p class="muted mb0"><strong>Leia com cautela:</strong> emoções variam por muitos motivos. Uma intensidade menor não significa necessariamente “melhora”, e uma intensidade igual não significa que a reflexão não valeu.</p>
        </section>
        <section class="card">
          <h2>Temas recorrentes nos pensamentos</h2>
          ${words.length ? `<p class="muted">Palavras que aparecem em mais de um registro.</p><div class="chips">${words.map(([w, n]) => `<span class="chip static">${esc(w)} · ${n}</span>`).join('')}</div>` : '<p class="muted mb0">Nenhuma palavra se repetiu entre registros neste período.</p>'}
          ${dist.length ? `<h3 class="mt">Padrões que você marcou</h3>${bars(dist.map((d) => ({ label: d.name, value: d.n, suffix: '×' })), dist[0].n)}` : ''}
        </section>`}
        <p class="muted">Estas informações descrevem seus registros. Não são avaliação nem diagnóstico. Se algo chamar sua atenção, pode ser um bom assunto para conversar com um profissional.</p>`;
    },
    mount: (root) => {
      root.addEventListener('click', (e) => {
        const mo = e.target.closest('[data-mo]');
        if (mo) { cal.m += +mo.dataset.mo; if (cal.m < 0) { cal.m = 11; cal.y--; } if (cal.m > 11) { cal.m = 0; cal.y++; } RS.app.render(); return; }
        const d = e.target.closest('[data-day]');
        if (d) { sel = sel === d.dataset.day ? null : d.dataset.day; RS.app.render(); return; }
        const p = e.target.closest('[data-p]');
        if (p) { period = +p.dataset.p; RS.app.render(); }
      });
    },
  };

  function summaryText(pr, pc, emo, period) {
    const parts = [];
    const when = period === 7 ? 'Nos últimos 7 dias' : period === 30 ? 'Nos últimos 30 dias' : 'No seu histórico';
    parts.push(`${when}, você fez ${pr.length} registro(s) de pensamento e ${pc.length} check-in(s).`);
    if (emo.length) parts.push(`A emoção que mais apareceu foi ${emo[0].nome.toLowerCase()} (${emo[0].n} vez${emo[0].n > 1 ? 'es' : ''}, intensidade média ${emo[0].media}).`);
    const days = new Set([...pr, ...pc].map((x) => RS.dayKey(x.when))).size;
    if (days) parts.push(`Você registrou algo em ${days} dia(s) diferente(s).`);
    return esc(parts.join(' '));
  }

  RS.journeyReset = () => { cal = null; sel = null; period = 30; };
})(window.RS);
