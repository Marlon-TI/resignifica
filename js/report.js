/* Compartilhar com meu terapeuta: seleção, prévia e PDF.
   A prévia e o PDF são gerados a partir da MESMA lista de blocos, o que garante que
   a prévia corresponde ao arquivo exportado (briefing §10). */
'use strict';
(function (RS) {
  const { esc, fmtDate, fmtDateTime } = RS;
  const MIN_CHART = 3;

  const FIELDS = [
    ['situacao', 'Situação'], ['pensamentos', 'Pensamentos automáticos'], ['crenca', 'Grau de crença'],
    ['emocoes', 'Emoções e intensidades'], ['corpo', 'Sensações físicas e comportamento'],
    ['evidencias', 'Evidências e reflexão'], ['alternativos', 'Formas mais equilibradas de compreender'],
    ['reavaliacao', 'Reavaliação (crença e emoções após a reflexão)'], ['plano', 'Plano de ação'], ['notas', 'Notas e respostas abertas dos check-ins'],
  ];
  const TALK_Q = 'Existe algo que você gostaria de conversar com seu terapeuta na próxima sessão?';

  let st = null;
  const reset = () => {
    st = {
      stage: 'form', format: 'completo', period: '30', from: RS.toDateInput(RS.daysAgo(30)), to: RS.toDateInput(new Date()),
      excluded: new Set(), excludedCk: new Set(), fields: Object.fromEntries(FIELDS.map(([k]) => [k, true])),
      includeDemo: !RS.demo.hasReal(), includeCheckins: true, nameMode: 'none', customName: '', talk: '', pdf: null, blocks: null,
    };
  };

  const range = () => {
    if (st.period === '7') return { from: RS.daysAgo(7), to: RS.endOfDay(new Date()), label: 'Últimos 7 dias' };
    if (st.period === '30') return { from: RS.daysAgo(30), to: RS.endOfDay(new Date()), label: 'Últimos 30 dias' };
    const from = RS.startOfDay(st.from + 'T00:00'); const to = RS.endOfDay(st.to + 'T00:00');
    return { from, to, label: 'Período personalizado' };
  };
  const inRange = (iso, r) => { const d = new Date(iso); return d >= r.from && d <= r.to; };
  const periodRecords = () => { const r = range(); return RS.store.records().filter((x) => x.status !== 'rascunho' && (st.includeDemo || !x.demo) && inRange(x.when, r)).sort((a, b) => new Date(a.when) - new Date(b.when)); };
  const selectedRecords = () => periodRecords().filter((x) => !st.excluded.has(x.id));
  const periodCheckins = () => { const r = range(); return RS.store.checkins().filter((c) => (st.includeDemo || !c.demo) && inRange(c.when, r)).sort((a, b) => new Date(a.when) - new Date(b.when)); };
  const selectedCheckins = () => (st.includeCheckins ? periodCheckins().filter((c) => !st.excludedCk.has(c.id)) : []);
  const reportName = () => {
    if (st.nameMode === 'preferred') return (RS.store.session.data.profile.name || '').trim();
    if (st.nameMode === 'custom') return st.customName.trim();
    return '';
  };
  const thoughtsWithBelief = (x, withBelief) => (x.pensamentos || []).map((p, i) => {
    if (!p || !p.trim()) return '';
    const a = (x.crencaAntes || [])[i];
    return withBelief && a != null ? `${p} (crença: ${a}/100)` : p;
  }).filter(Boolean);
  const distNames = (x) => (x.distorcoes || []).map((id) => (RS.content.DISTORTIONS.find((z) => z.id === id) || {}).name).filter(Boolean);
  function beliefAvg(recs) {
    let n = 0; let a = 0; let d = 0;
    recs.forEach((x) => (x.crencaAntes || []).forEach((v, i) => { const w = (x.crencaDepois || [])[i]; if (v != null && w != null && (x.pensamentos[i] || '').trim()) { n++; a += v; d += w; } }));
    return n ? { n, antes: Math.round(a / n), depois: Math.round(d / n) } : null;
  }

  /* ---------- Modelo do relatório → blocos ---------- */
  function buildBlocks() {
    const r = range();
    const recs = selectedRecords();
    const cks = selectedCheckins();
    const F = st.fields;
    const full = st.format === 'completo';
    const B = [];
    const generatedAt = new Date().toISOString();

    // Cabeçalho e período
    B.push({ t: 'title', text: `ReSignifica · Relatório ${full ? 'completo' : 'resumido'}` });
    B.push({ t: 'meta', text: `${r.label}: ${fmtDate(r.from.toISOString())} a ${fmtDate(r.to.toISOString())}` });
    const nm = reportName();
    if (nm) B.push({ t: 'meta', text: `Nome: ${nm}` });
    B.push({ t: 'note', text: 'Relatório descritivo gerado pelo próprio usuário para apoiar a conversa com um profissional. Apresenta padrões descritivos; não é diagnóstico nem interpretação clínica.' });

    // Resumo
    B.push({ t: 'h2', text: 'Resumo dos registros' });
    const comp = recs.filter((x) => x.status === 'completo').length;
    const days = new Set([...recs, ...cks].map((x) => RS.dayKey(x.when))).size;
    const summary = [`Registros de pensamento: ${recs.length} (${comp} com reflexão, ${recs.length - comp} breve${recs.length - comp === 1 ? '' : 's'}).`];
    if (st.includeCheckins) summary.push(`Check-ins do “Meu momento”: ${cks.length}.`);
    summary.push(`Dias com algum registro: ${days}.`);
    B.push({ t: 'p', text: summary.join(' ') });

    if (!full) {
      // RESUMIDO: frequência, emoções predominantes, padrões, evolução emocional, pautas
      const freq = RS.stats.emotionFreq(recs, cks);
      if (freq.length) {
        B.push({ t: 'h2', text: 'Emoções predominantes' });
        B.push({ t: 'p', text: freq.slice(0, 8).map((e) => `${e.nome}: ${e.n} vez(es), intensidade média ${e.media}/100`).join('\n') });
        if (recs.length + cks.length >= MIN_CHART) B.push({ t: 'bars', caption: 'Frequência das emoções registradas', rows: freq.slice(0, 8).map((e) => ({ label: e.nome, value: e.n })) });
      }
      const nao = cks.filter((c) => c.naoIdentifica).length;
      if (nao) B.push({ t: 'p', text: `Em ${nao} check-in(s), a pessoa indicou não conseguir identificar o que sentia.` });
      const dist = RS.stats.distortionFreq(recs);
      if (dist.length) {
        B.push({ t: 'h2', text: 'Padrões de pensamento marcados pelo usuário' });
        B.push({ t: 'p', text: dist.map((d) => `${d.name}: ${d.n} vez(es)`).join('\n') });
      }
      const ba = RS.stats.beforeAfter(recs); const bl = beliefAvg(recs);
      if (ba.length || bl) {
        B.push({ t: 'h2', text: 'Evolução emocional após a reflexão' });
        if (ba.length) B.push({ t: 'p', text: ba.map((x) => `${x.nome}: média de ${x.antes} para ${x.depois} (${x.n} reavaliação(ões))`).join('\n') });
        if (bl) B.push({ t: 'p', text: `Grau de crença no pensamento inicial: média de ${bl.antes} para ${bl.depois} (${bl.n} reavaliação(ões)).` });
        B.push({ t: 'note', text: 'Intensidade igual ou maior após a reflexão não significa fracasso.' });
      }
    } else {
      // COMPLETO: registros detalhados conforme campos escolhidos
      if (recs.length) {
        B.push({ t: 'h2', text: 'Registros detalhados' });
        recs.forEach((x, i) => {
          const rows = [];
          if (F.situacao) { if (x.situacao) rows.push(['Situação', x.situacao]); if (x.contexto) rows.push(['Contexto', x.contexto]); }
          if (F.pensamentos) { const p = thoughtsWithBelief(x, F.crenca); if (p.length) rows.push(['Pensamento automático', p.join('\n')]); }
          else if (F.crenca) { const c = (x.crencaAntes || []).filter((v, k) => v != null && (x.pensamentos[k] || '').trim()); if (c.length) rows.push(['Grau de crença', c.map((v) => `${v}/100`).join(' · ')]); }
          if (F.emocoes && x.emocoes.length) { const em = x.emocoes.filter((e) => e.antes != null); if (em.length) rows.push(['Emoções', em.map((e) => `${e.nome}: ${e.antes}/100`).join(' · ')]); }
          if (F.corpo) { if (x.sensacoes) rows.push(['Sensações físicas', x.sensacoes]); if (x.comportamento) rows.push(['Comportamento', x.comportamento]); }
          if (F.evidencias) {
            if (x.evidFavor) rows.push(['Evidências que sustentam o pensamento', x.evidFavor]);
            if (x.evidContra) rows.push(['Evidências que não estavam sendo consideradas', x.evidContra]);
            if (x.outrasExplic) rows.push(['Outras maneiras de compreender', x.outrasExplic]);
            if (x.alguemQuerido) rows.push(['O que diria a alguém querido', x.alguemQuerido]);
            const d = distNames(x); if (d.length) rows.push(['Padrões que o usuário identificou', d.join(', ')]);
          }
          if (F.alternativos && x.alternativo) rows.push(['Forma mais equilibrada de compreender', x.alternativo]);
          if (F.reavaliacao) {
            const cr = (x.crencaDepois || []).map((v, k) => (v != null && (x.pensamentos[k] || '').trim() ? (x.crencaAntes[k] != null ? `de ${x.crencaAntes[k]} para ${v}` : `${v}/100`) : '')).filter(Boolean);
            if (cr.length) rows.push(['Grau de crença após a reflexão', cr.join(' · ')]);
            const ev = x.emocoes.filter((e) => e.depois != null);
            if (ev.length) rows.push(['Emoções após a reflexão', ev.map((e) => (e.antes == null ? `${e.nome}: ${e.depois}/100 (surgiu após a reflexão)` : `${e.nome}: de ${e.antes} para ${e.depois}`)).join(' · ')]);
          }
          if (F.plano && x.planoAcao) rows.push(['Plano de ação', x.planoAcao]);
          if (F.notas && x.notas) rows.push(['Notas', x.notas]);
          B.push({ t: 'rec', recId: x.id, title: `${i + 1}. ${fmtDateTime(x.when)}${x.status === 'completo' ? ' · com reflexão' : ' · breve'}`, rows });
        });
      }
      if (cks.length) {
        B.push({ t: 'h2', text: 'Check-ins do “Meu momento”' });
        cks.forEach((c) => {
          const rows = [];
          const mood = (RS.content.MOODS.find((m) => m.v === c.humor) || {}).label;
          if (mood) rows.push(['Estado geral', mood]);
          if (c.emocoes.length) rows.push(['Emoções', c.emocoes.map((e) => `${e.nome}: ${e.intensidade}/100`).join(' · ')]);
          if (c.naoIdentifica) rows.push(['Identificação das emoções', 'Não consegui identificar o que estava sentindo']);
          if (F.notas && c.contribuiu) rows.push(['O que contribuiu', c.contribuiu]);
          if (F.notas && c.notas) rows.push(['Notas', c.notas]);
          B.push({ t: 'rec', ckId: c.id, title: fmtDateTime(c.when), rows });
        });
      }
      if (F.emocoes && (recs.length || cks.length)) {
        const freq = RS.stats.emotionFreq(recs, cks);
        if (freq.length) {
          B.push({ t: 'h2', text: 'Emoções e intensidades' });
          B.push({ t: 'p', text: freq.map((e) => `${e.nome}: ${e.n} vez(es), intensidade média ${e.media}/100`).join('\n') });
          if (recs.length + cks.length >= MIN_CHART) B.push({ t: 'bars', caption: 'Frequência das emoções registradas', rows: freq.slice(0, 8).map((e) => ({ label: e.nome, value: e.n })) });
        }
      }
      if (F.alternativos) {
        const alts = recs.filter((x) => x.alternativo && x.alternativo.trim());
        if (alts.length) {
          B.push({ t: 'h2', text: 'Formas mais equilibradas de compreender' });
          alts.forEach((x) => B.push({ t: 'rec', recId: x.id, title: fmtDate(x.when), rows: [['Pensamento automático', (x.pensamentos || []).filter(Boolean).join('\n') || '-'], ['Forma mais equilibrada', x.alternativo]] }));
        }
      }
    }

    // Pautas para a próxima sessão
    if (st.talk.trim()) {
      B.push({ t: 'h2', text: 'Assuntos para a próxima sessão' });
      B.push({ t: 'highlight', text: st.talk.trim() });
    }

    // Rodapé
    B.push({ t: 'footer', text: `Gerado em ${fmtDateTime(generatedAt)} pelo aplicativo ReSignifica. CONFIDENCIAL: contém informações pessoais e sensíveis, destinadas exclusivamente ao profissional escolhido pelo usuário. A ausência do nome não garante anonimato.` });
    return B.map(sanitizeBlock);
  }

  /* Fonte padrão do PDF usa WinAnsi: remove caracteres fora dela (ex.: emojis) também da prévia, para que ambas sejam idênticas. */
  const EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  const clean = (s) => Array.from(String(s)).filter((ch) => { const c = ch.codePointAt(0); return c === 10 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || EXTRA.includes(ch); }).join('');
  function sanitizeBlock(b) {
    const o = Object.assign({}, b);
    if (o.text != null) o.text = clean(o.text);
    if (o.title != null) o.title = clean(o.title);
    if (o.caption != null) o.caption = clean(o.caption);
    if (o.rows) o.rows = o.rows.map((r) => (Array.isArray(r) ? r.map(clean) : Object.assign({}, r, { label: clean(r.label) })));
    return o;
  }

  /* ---------- Blocos → HTML (prévia) ---------- */
  function blocksToHTML(B, editable) {
    const nl = (s) => esc(s).replace(/\n/g, '<br>');
    return B.map((b) => {
      switch (b.t) {
        case 'title': return `<h1>${esc(b.text)}</h1>`;
        case 'meta': return `<p class="mb0"><strong>${esc(b.text)}</strong></p>`;
        case 'note': return `<p class="muted mt">${esc(b.text)}</p>`;
        case 'h2': return `<h2>${esc(b.text)}</h2>`;
        case 'p': return `<p>${nl(b.text)}</p>`;
        case 'highlight': return `<p class="highlight">${nl(b.text)}</p>`;
        case 'rec': return `<div class="rec"><h3>${esc(b.title)}</h3>${editable && (b.recId || b.ckId) ? `<button type="button" class="btn ghost small no-print" data-rm-rec="${b.recId || ''}" data-rm-ck="${b.ckId || ''}">Remover do relatório</button>` : ''}${b.rows.length ? b.rows.map(([l, v]) => `<p class="mb0"><span class="lbl">${esc(l)}:</span> ${nl(v)}</p>`).join('') : '<p class="muted mb0">Nenhum dos campos escolhidos foi preenchido.</p>'}</div>`;
        case 'bars': { const max = Math.max(...b.rows.map((r) => r.value)); return `<p class="lbl mb0">${esc(b.caption)}</p><div class="bars">${b.rows.map((r) => `<div class="bar"><span>${esc(r.label)}</span><span class="track"><span class="fill" style="width:${Math.round((r.value / max) * 100)}%"></span></span><span class="n">${r.value}</span></div>`).join('')}</div>`; }
        case 'footer': return `<div class="foot">${esc(b.text)}</div>`;
        default: return '';
      }
    }).join('');
  }

  /* ---------- Blocos → PDF (jsPDF) ---------- */
  function blocksToPDF(B) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    // Metadados neutros: sem nome, e-mail ou conteúdo do usuário
    doc.setDocumentProperties({ title: 'Relatório ReSignifica', subject: '', author: '', keywords: '', creator: 'ReSignifica' });
    const W = 210; const H = 297; const M = 18; const CW = W - 2 * M;
    const footer = B.find((b) => b.t === 'footer');
    let y = M;
    const GREEN = [31, 77, 58]; const SAGE = [106, 182, 146]; const TEXT = [27, 27, 27]; const MUTED = [91, 107, 99];
    const ensure = (h) => { if (y + h > H - 24) { doc.addPage(); y = M; } };
    const text = (str, size, style, color, indent = 0, lh = 1.4) => {
      doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(str), CW - indent);
      const step = size * 0.3528 * lh;
      lines.forEach((ln) => { ensure(step); doc.text(ln, M + indent, y + step * 0.8); y += step; });
    };
    B.forEach((b) => {
      switch (b.t) {
        case 'title': doc.setFillColor(...SAGE); doc.rect(0, 0, W, 6, 'F'); y = M; text(b.text, 17, 'bold', GREEN); y += 2; break;
        case 'meta': text(b.text, 11, 'bold', TEXT); break;
        case 'note': y += 2; text(b.text, 9.5, 'italic', MUTED); y += 2; break;
        case 'h2': y += 4; ensure(12); text(b.text, 13, 'bold', GREEN); doc.setDrawColor(207, 227, 214); doc.line(M, y + 1, W - M, y + 1); y += 4; break;
        case 'p': text(b.text, 10.5, 'normal', TEXT); y += 2; break;
        case 'highlight': {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
          const lines = doc.splitTextToSize(b.text, CW - 10); const h = lines.length * 11 * 0.3528 * 1.4 + 6;
          ensure(Math.min(h, 60)); const y0 = y;
          if (y0 + h <= H - 24) { doc.setFillColor(234, 245, 236); doc.rect(M, y0, CW, h, 'F'); doc.setFillColor(...SAGE); doc.rect(M, y0, 1.5, h, 'F'); }
          y += 3; text(b.text, 11, 'normal', TEXT, 5); y += 4; break;
        }
        case 'rec': {
          ensure(16); y += 2; text(b.title, 11, 'bold', GREEN);
          if (!b.rows.length) text('Nenhum dos campos escolhidos foi preenchido.', 10, 'italic', MUTED, 3);
          b.rows.forEach(([l, v]) => { text(l, 9.5, 'bold', MUTED, 3, 1.3); text(v, 10.5, 'normal', TEXT, 3); y += 0.8; });
          y += 1.5; doc.setDrawColor(227, 236, 230); ensure(2); doc.line(M, y, W - M, y); y += 2; break;
        }
        case 'bars': {
          text(b.caption, 10, 'bold', TEXT); y += 1;
          const max = Math.max(...b.rows.map((r) => r.value)); const LW = 38; const BW = CW - LW - 14;
          b.rows.forEach((r) => {
            ensure(7);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...TEXT);
            doc.text(doc.splitTextToSize(r.label, LW - 2)[0], M, y + 4);
            doc.setFillColor(234, 245, 236); doc.rect(M + LW, y + 0.8, BW, 4, 'F');
            doc.setFillColor(...SAGE); doc.rect(M + LW, y + 0.8, Math.max(1, (r.value / max) * BW), 4, 'F');
            doc.text(String(r.value), M + LW + BW + 3, y + 4); y += 6.5;
          });
          y += 2; break;
        }
        default: break;
      }
    });
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(207, 227, 214); doc.line(M, H - 20, W - M, H - 20);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(footer.text, CW - 20), M, H - 16);
      doc.text(`${i}/${pages}`, W - M, H - 16, { align: 'right' });
    }
    return doc.output('blob');
  }

  /* ---------- Tela ---------- */
  RS.views.therapist = {
    title: 'Compartilhar com meu terapeuta', nav: 'terapeuta',
    render: () => {
      if (!st) reset();
      if (st.stage === 'preview' || st.stage === 'done') {
        const blocks = st.blocks || (st.blocks = buildBlocks());
        return `
          <h1>${st.stage === 'done' ? 'Relatório pronto' : 'Pré-visualização'}</h1>
          <p class="muted">${st.stage === 'done' ? 'O PDF foi gerado neste aparelho. Ele não foi enviado a ninguém.' : 'O PDF terá exatamente este conteúdo. Revise e, se quiser, remova itens antes de gerar.'}</p>
          ${st.stage === 'done' ? `
            <div class="card soft no-print">
              <div class="btn-row"><button class="btn" id="dl">Baixar PDF</button>
              ${canShare() ? '<button class="btn secondary" id="sh">' + RS.icon('share') + ' Compartilhar…</button>' : ''}</div>
              <p class="muted mt mb0">${canShare() ? 'Ao compartilhar, você escolhe o aplicativo e o destinatário e confirma o envio nele.' : 'Este navegador não permite compartilhar arquivos diretamente. Baixe o PDF e envie pelo aplicativo que preferir.'}</p>
            </div>` : ''}
          <div class="report-preview" id="pv">${blocksToHTML(blocks, st.stage === 'preview')}</div>
          <div class="btn-row mt no-print">
            <button class="btn secondary" id="back">Voltar e ajustar</button>
            ${st.stage === 'preview' ? '<button class="btn" id="gen">Gerar PDF</button>' : '<button class="btn ghost" id="new">Novo relatório</button>'}
          </div>`;
      }
      const recs = periodRecords();
      const ckCount = periodCheckins().length;
      return `
        <h1>Compartilhar com meu terapeuta</h1>
        <p>Recurso opcional. Você escolhe o período, os registros e as informações; vê uma prévia; e decide se e com quem compartilhar. <strong>Nada é enviado automaticamente.</strong></p>
        <div class="card soft"><p class="mb0">Combine previamente com seu terapeuta como e quando os registros serão utilizados. O compartilhamento não garante leitura ou resposta imediata e não substitui o atendimento em situações de emergência.</p></div>
        <form id="rp">
          <section class="card"><h2>1. Formato</h2>
            <div class="seg" role="group" aria-label="Formato do relatório">
              <button type="button" data-format="completo" aria-pressed="${st.format === 'completo'}">Completo: com o que escrevi</button>
              <button type="button" data-format="resumido" aria-pressed="${st.format === 'resumido'}">Resumido: só números e padrões</button></div>
            <p class="muted mt mb0">${st.format === 'resumido'
              ? '<strong>Resumido:</strong> frequência de registros, emoções predominantes, padrões que você marcou, evolução emocional e assuntos para a sessão. <strong>Não inclui nada do que você escreveu</strong> (situações, pensamentos, reflexões, notas). Para levar seus textos, escolha Completo.'
              : '<strong>Completo:</strong> tudo o que você escreveu em cada registro (situação, contexto, pensamentos, grau de crença, emoções, sensações, comportamento, evidências, outras maneiras de compreender, o que diria a alguém querido, forma mais equilibrada, reavaliação, plano de ação e notas) e as respostas dos check-ins. Desmarque abaixo o que não quiser incluir.'}</p>
          </section>
          <section class="card"><h2>2. Período</h2>
            <div class="seg" role="group" aria-label="Período">
              <button type="button" data-period="7" aria-pressed="${st.period === '7'}">Últimos 7 dias</button>
              <button type="button" data-period="30" aria-pressed="${st.period === '30'}">Últimos 30 dias</button>
              <button type="button" data-period="custom" aria-pressed="${st.period === 'custom'}">Personalizado</button></div>
            ${st.period === 'custom' ? `<div class="grid2 mt"><div><label for="rp-from">De</label><input type="date" id="rp-from" value="${st.from}"></div><div><label for="rp-to">Até</label><input type="date" id="rp-to" value="${st.to}"></div></div>` : ''}
          </section>
          <section class="card"><h2>3. Registros</h2>
            ${recs.length ? `<div class="btn-row mb0"><button type="button" class="btn ghost small" id="all">Marcar todos</button><button type="button" class="btn ghost small" id="none">Desmarcar todos</button></div>
              <div class="sel-list">${recs.map((r) => `<label class="check"><input type="checkbox" data-rec="${r.id}" ${st.excluded.has(r.id) ? '' : 'checked'}>
                <span><span class="muted">${fmtDateTime(r.when)}</span> ${RS.recordUtil.statusBadge(r.status)}<br>${esc(RS.truncate(RS.recordUtil.firstThought(r) || r.situacao, 100))}</span></label>`).join('')}</div>`
              : '<p class="muted mb0">Nenhum registro salvo neste período. Rascunhos não entram no relatório.</p>'}
            ${RS.demo.has() ? `<label class="check mt"><input type="checkbox" id="rp-demo" ${st.includeDemo ? 'checked' : ''}> <span>Incluir dados de exemplo</span></label>` : ''}
            <label class="check mt"><input type="checkbox" id="ck-inc" ${st.includeCheckins ? 'checked' : ''}> <span>Incluir check-ins do “Meu momento” (${ckCount} no período)</span></label>
          </section>
          ${st.format === 'completo' ? `<section class="card"><h2>4. Informações exibidas</h2>
            ${FIELDS.map(([k, l]) => `<label class="check"><input type="checkbox" data-field="${k}" ${st.fields[k] ? 'checked' : ''}> <span>${l}</span></label>`).join('')}
          </section>` : ''}
          <section class="card soft"><h2><label for="rp-talk" style="font-weight:inherit;margin:0">${TALK_Q}</label></h2>
            <p class="muted">Opcional. Aparece em destaque no relatório.</p>
            <textarea id="rp-talk" rows="4">${esc(st.talk)}</textarea></section>
          <section class="card"><h2>Nome no relatório</h2>
            <fieldset class="mb0"><legend class="sr-only">Nome no relatório</legend>
            <label class="check"><input type="radio" name="nm" value="none" ${st.nameMode === 'none' ? 'checked' : ''}> <span>Nenhum nome</span></label>
            ${RS.store.session.data.profile.name ? `<label class="check"><input type="radio" name="nm" value="preferred" ${st.nameMode === 'preferred' ? 'checked' : ''}> <span>Meu nome de preferência (${esc(RS.store.session.data.profile.name)})</span></label>` : ''}
            <label class="check"><input type="radio" name="nm" value="custom" ${st.nameMode === 'custom' ? 'checked' : ''}> <span>Outro nome, só para este relatório</span></label>
            ${st.nameMode === 'custom' ? `<div class="field"><label for="rp-cname" class="sr-only">Nome para este relatório</label><input id="rp-cname" type="text" maxlength="60" value="${esc(st.customName)}" placeholder="Nome para este relatório"><span class="hint">Não altera o nome do seu perfil.</span></div>` : ''}
            </fieldset>
            <p class="muted mb0">Ocultar o nome não garante anonimato: seus textos podem conter nomes de outras pessoas, lugares ou detalhes que identificam você. Revise na prévia e remova o que preferir. O e-mail nunca entra no relatório.</p>
          </section>
          <div class="btn-row"><button type="submit" class="btn">Pré-visualizar</button></div>
        </form>`;
    },
    mount: (root) => {
      const go = (stage) => { st.stage = stage; RS.app.render(); window.scrollTo(0, 0); };
      const f = root.querySelector('#rp');
      if (f) {
        f.addEventListener('click', (e) => {
          const fm = e.target.closest('[data-format]');
          if (fm) { st.format = fm.dataset.format; RS.app.render(); return; }
          const p = e.target.closest('[data-period]');
          if (p) { st.period = p.dataset.period; RS.app.render(); return; }
          if (e.target.id === 'all') { st.excluded.clear(); RS.app.render(); }
          if (e.target.id === 'none') { periodRecords().forEach((r) => st.excluded.add(r.id)); RS.app.render(); }
        });
        f.addEventListener('change', (e) => {
          const t = e.target;
          if (t.dataset.rec) { if (t.checked) st.excluded.delete(t.dataset.rec); else st.excluded.add(t.dataset.rec); }
          else if (t.dataset.field) st.fields[t.dataset.field] = t.checked;
          else if (t.id === 'ck-inc') { st.includeCheckins = t.checked; }
          else if (t.id === 'rp-demo') { st.includeDemo = t.checked; RS.app.render(); }
          else if (t.name === 'nm') { st.nameMode = t.value; RS.app.render(); }
          else if (t.id === 'rp-from' || t.id === 'rp-to') { if (t.value) { st[t.id === 'rp-from' ? 'from' : 'to'] = t.value; RS.app.render(); } }
        });
        f.addEventListener('input', (e) => { if (e.target.id === 'rp-talk') st.talk = e.target.value; if (e.target.id === 'rp-cname') st.customName = e.target.value; });
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          if (st.period === 'custom' && st.from > st.to) { RS.toast('A data inicial precisa ser anterior à final.'); return; }
          if (!selectedRecords().length && !(st.includeCheckins && periodCheckins().length) && !st.talk.trim()) { RS.toast('Selecione ao menos um registro ou escreva o que gostaria de conversar.'); return; }
          if (st.format === 'completo' && !Object.values(st.fields).some(Boolean)) { RS.toast('Escolha ao menos uma informação para exibir.'); return; }
          if (st.nameMode === 'custom' && !st.customName.trim()) { RS.toast('Escreva o nome para este relatório ou escolha “Nenhum nome”.'); return; }
          st.blocks = buildBlocks();
          go('preview');
        });
        return;
      }
      root.querySelector('#back').addEventListener('click', () => { st.pdf = null; st.blocks = null; go('form'); });
      root.querySelector('#pv').addEventListener('click', (e) => {
        const b = e.target.closest('[data-rm-rec],[data-rm-ck]');
        if (!b) return;
        if (b.dataset.rmRec) st.excluded.add(b.dataset.rmRec);
        if (b.dataset.rmCk) st.excludedCk.add(b.dataset.rmCk);
        st.blocks = buildBlocks(); RS.app.render(); RS.toast('Item removido do relatório.');
      });
      const gen = root.querySelector('#gen');
      if (gen) gen.addEventListener('click', () => {
        try { st.pdf = blocksToPDF(st.blocks); go('done'); }
        catch (e) { console.error(e); RS.toast('Não foi possível gerar o PDF.'); }
      });
      const nw = root.querySelector('#new');
      if (nw) nw.addEventListener('click', () => { reset(); RS.app.render(); });
      const fname = () => `ReSignifica-relatorio-${RS.toDateInput(new Date())}.pdf`;
      const dl = root.querySelector('#dl');
      if (dl) dl.addEventListener('click', () => { RS.downloadBlob(st.pdf, fname()); RS.toast('PDF baixado neste aparelho.'); });
      const sh = root.querySelector('#sh');
      if (sh) sh.addEventListener('click', async () => {
        const ok = await RS.modal({
          title: 'Antes de compartilhar',
          body: `<p>O relatório contém informações pessoais e sensíveis.</p>
            <ul class="notice-list"><li>Confira se o destinatário está correto antes de enviar.</li>
            <li>Apps de mensagem e e-mail guardam cópias do arquivo em celulares, computadores e servidores, e podem fazer backup automático na nuvem.</li>
            <li>Evite grupos e aparelhos compartilhados.</li>
            <li>Depois de enviado, o arquivo fica fora do controle do ReSignifica.</li></ul>`,
          actions: [{ label: 'Cancelar', value: false, kind: 'secondary' }, { label: 'Entendi, escolher destino', value: true }],
        });
        if (ok.value !== true) return;
        const file = new File([st.pdf], fname(), { type: 'application/pdf' });
        try {
          await navigator.share({ files: [file], title: 'Relatório ReSignifica' });
          RS.toast('O menu de compartilhamento foi concluído. Confirme no aplicativo escolhido se o envio foi feito.', 6000);
        } catch (e) {
          RS.toast(e && e.name === 'AbortError' ? 'Compartilhamento cancelado. Nada foi enviado.' : 'Não foi possível abrir o compartilhamento. Use “Baixar PDF”.', 5000);
        }
      });
    },
  };

  function canShare() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] })); } catch (e) { return false; }
  }

  RS.report = { reset: () => { st = null; }, buildBlocks: () => buildBlocks(), blocksToHTML, blocksToPDF, _state: () => st };
})(window.RS);
