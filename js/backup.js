/* Backup restaurável protegido por senha.
   Formato: JSON com cabeçalho legível (app, tipo, versão, data) e conteúdo cifrado
   com AES-GCM 256, chave derivada da senha do backup (PBKDF2-SHA256). Dados de exemplo não entram. */
'use strict';
(function (RS) {
  const TYPE = 'resignifica-backup';

  async function create(password) {
    const d = RS.store.session.data;
    const payload = {
      profile: d.profile,
      settings: d.settings,
      records: d.records.filter((r) => !r.demo && r.persisted !== false),
      checkins: d.checkins.filter((c) => !c.demo),
    };
    const salt = RS.crypto.randomSalt();
    const key = await RS.crypto.deriveKey(password, salt);
    const box = await RS.crypto.encryptJSON(key, payload);
    const file = {
      app: 'ReSignifica', type: TYPE, version: 1, createdAt: new Date().toISOString(),
      counts: { records: payload.records.length, checkins: payload.checkins.length },
      kdf: { name: 'PBKDF2-SHA256', iterations: RS.crypto.ITER, salt }, cipher: 'AES-GCM-256', iv: box.iv, ct: box.ct,
    };
    return new Blob([JSON.stringify(file)], { type: 'application/json' });
  }

  function parse(text) {
    let f;
    try { f = JSON.parse(text); } catch (e) { throw new Error('Este arquivo não é um backup do ReSignifica.'); }
    if (!f || f.type !== TYPE || !f.iv || !f.ct || !f.kdf) throw new Error('Este arquivo não é um backup do ReSignifica.');
    if (f.version > 1) throw new Error('Este backup foi criado por uma versão mais nova do app.');
    return f;
  }

  async function open(f, password) {
    const key = await RS.crypto.deriveKey(password, f.kdf.salt, f.kdf.iterations);
    try { return await RS.crypto.decryptJSON(key, { iv: f.iv, ct: f.ct }); }
    catch (e) { throw new Error('Senha do backup incorreta, ou arquivo danificado.'); }
  }

  /* Mescla: registros novos entram; registros com o mesmo id ficam com a versão mais recente. Nada é apagado. */
  function merge(payload) {
    const d = RS.store.session.data;
    const res = { added: 0, updated: 0, kept: 0 };
    const mergeList = (cur, incoming) => {
      (incoming || []).forEach((x) => {
        const i = cur.findIndex((y) => y.id === x.id);
        if (i < 0) { cur.push(x); res.added++; }
        else if (new Date(x.updatedAt || 0) > new Date(cur[i].updatedAt || 0)) { cur[i] = x; res.updated++; }
        else res.kept++;
      });
    };
    mergeList(d.records, payload.records);
    mergeList(d.checkins, payload.checkins);
    RS.store.saveNow();
    return res;
  }

  RS.backup = { create, parse, open, merge };
})(window.RS);
