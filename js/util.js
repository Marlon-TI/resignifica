/* Utilidades gerais — ReSignifica */
'use strict';
window.RS = window.RS || {};

(function (RS) {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const uid = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  };

  const pad = (n) => String(n).padStart(2, '0');
  const toLocalInput = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayKey = (iso) => toDateInput(new Date(iso));
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtLong = (iso) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const daysAgo = (n) => { const d = startOfDay(new Date()); d.setDate(d.getDate() - n + 1); return d; };

  const debounce = (fn, ms) => {
    let t;
    const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    f.flush = (...a) => { clearTimeout(t); fn(...a); };
    return f;
  };

  const truncate = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

  let toastTimer;
  const toast = (msg, ms = 3200) => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  };

  /* Modal acessível (sem alert/confirm nativos) */
  const modal = ({ title, body, actions }) => new Promise((resolve) => {
    const root = document.getElementById('modal-root');
    const prev = document.activeElement;
    root.innerHTML = `
      <div class="modal-back" data-close>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title">${esc(title)}</h2>
          <div class="modal-body">${body || ''}</div>
          <div class="btn-row end mt">${actions.map((a, i) =>
            `<button type="button" class="btn ${a.kind || ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>
        </div>
      </div>`;
    const back = root.firstElementChild;
    const close = (val) => {
      document.removeEventListener('keydown', onKey);
      const data = {};
      root.querySelectorAll('[name]').forEach((el) => { data[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
      root.innerHTML = '';
      if (prev && prev.focus) prev.focus();
      resolve({ value: val, data });
    };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', (e) => {
      if (e.target === back) return close(null);
      const b = e.target.closest('button[data-i]');
      if (b) close(actions[+b.dataset.i].value);
    });
    const first = root.querySelector('input, textarea, select') || root.querySelector('button[data-i]:last-child');
    if (first) first.focus();
  });

  const confirmDialog = async (title, text, okLabel = 'Confirmar', danger = false) => {
    const r = await modal({
      title, body: `<p>${text}</p>`,
      actions: [{ label: 'Cancelar', value: false, kind: 'secondary' }, { label: okLabel, value: true, kind: danger ? 'danger' : '' }],
    });
    return r.value === true;
  };

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  };

  /* Ícones SVG inline (traço) */
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    moment: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    thoughts: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/>',
    perspective: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    journey: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    learn: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    help: '<path d="M12 21s-7-4.5-9.3-9.1C1 8.5 3 5 6.5 5c2 0 3.4 1.1 4.2 2.4h2.6C14.1 6.1 15.5 5 17.5 5 21 5 23 8.5 21.3 11.9 19 16.5 12 21 12 21z"/>',
    share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4M12 2v14"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  };
  const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

  Object.assign(RS, {
    esc, uid, pad, toLocalInput, toDateInput, dayKey, fmtDate, fmtDateTime, fmtLong, startOfDay, endOfDay, daysAgo,
    debounce, truncate, toast, modal, confirmDialog, downloadBlob, icon,
  });
})(window.RS);

/* Cartão da idealizadora (Sobre, Início, Aprender, Boas-vindas) */
(function (RS) {
  RS.authorCard = (compact) => {
    const a = RS.content.AUTHOR;
    const ig = `<a class="btn ${compact ? 'ghost small' : 'secondary small'}" href="${a.instagram}" target="_blank" rel="noopener noreferrer">${RS.icon('ext')} Instagram ${a.handle}</a>`;
    return `<div class="author${compact ? ' compact' : ''}">
      <div class="avatar" aria-hidden="true">RM</div>
      <div class="author-txt">
        <p class="label mb0">Idealização e conteúdo psicológico</p>
        <p class="author-name mb0">${a.name}</p>
        <p class="muted mb0">${a.role} · ${a.crp}</p>
        <div class="mt-s">${ig}</div>
      </div></div>`;
  };
})(window.RS);
