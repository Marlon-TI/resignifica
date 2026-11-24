/* Armazenamento local cifrado (IndexedDB) e sessão do usuário.
   - "accounts": dados mínimos de acesso (nome, e-mail, salt, verificador cifrado)
   - "vaults":   todo o conteúdo do usuário, cifrado com AES-GCM */
'use strict';
(function (RS) {
  const DB_NAME = 'resignifica';
  const DB_VER = 1;
  let dbp = null;

  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('accounts')) d.createObjectStore('accounts', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('vaults')) d.createObjectStore('vaults', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      const r = fn(s);
      if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  const getAll = (store) => tx(store, 'readonly', (s) => s.getAll());
  const get = (store, id) => tx(store, 'readonly', (s) => s.get(id));
  const put = (store, val) => tx(store, 'readwrite', (s) => s.put(val));
  const del = (store, id) => tx(store, 'readwrite', (s) => s.delete(id));

  const VERIFY = 'resignifica-ok';
  const emptyData = (name) => ({
    version: 1,
    profile: { name },
    settings: { autoLockMin: 10, reminder: { enabled: false, time: '20:00' }, lastReminderDay: null },
    consent: { acceptedAt: new Date().toISOString(), termsVersion: '1.0' },
    records: [],
    checkins: [],
  });

  const session = { account: null, key: null, data: null };

  async function findByEmail(email) {
    const all = await getAll('accounts');
    return all.find((a) => a.email === email.trim().toLowerCase()) || null;
  }

  async function createAccount(name, email, password) {
    email = email.trim().toLowerCase();
    if (await findByEmail(email)) throw new Error('Já existe uma conta com este e-mail neste aparelho.');
    const salt = RS.crypto.randomSalt();
    const key = await RS.crypto.deriveKey(password, salt);
    const account = {
      id: RS.uid(), name: name.trim(), email, salt, iter: RS.crypto.ITER,
      verifier: await RS.crypto.encryptJSON(key, VERIFY), createdAt: new Date().toISOString(),
    };
    const data = emptyData(account.name);
    await put('accounts', account);
    await put('vaults', { id: account.id, box: await RS.crypto.encryptJSON(key, data) });
    Object.assign(session, { account, key, data });
    return account;
  }

  async function login(email, password) {
    const account = await findByEmail(email);
    const fail = new Error('E-mail ou senha incorretos.');
    if (!account) throw fail;
    const key = await RS.crypto.deriveKey(password, account.salt, account.iter);
    try {
      const v = await RS.crypto.decryptJSON(key, account.verifier);
      if (v !== VERIFY) throw fail;
    } catch (e) { throw fail; }
    const vault = await get('vaults', account.id);
    const data = vault ? await RS.crypto.decryptJSON(key, vault.box) : emptyData(account.name);
    migrate(data);
    Object.assign(session, { account, key, data });
    return account;
  }

  function migrate(data) {
    data.records = data.records || [];
    data.checkins = data.checkins || [];
    data.settings = Object.assign({ autoLockMin: 10, reminder: { enabled: false, time: '20:00' } }, data.settings || {});
  }

  function logout() {
    saveNow();
    session.account = null; session.key = null; session.data = null;
  }

  let saving = Promise.resolve();
  async function persist() {
    if (!session.key) return;
    const { account, key, data } = session;
    const box = await RS.crypto.encryptJSON(key, data);
    await put('vaults', { id: account.id, box });
  }
  function saveNow() { saving = saving.then(persist).catch((e) => { console.error(e); RS.toast('Não foi possível salvar. Tente novamente.'); }); return saving; }
  const save = RS.debounce(saveNow, 400);
  window.addEventListener('pagehide', () => { if (session.key) saveNow(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && session.key) saveNow(); });

  async function changePassword(oldPw, newPw) {
    const { account } = session;
    const oldKey = await RS.crypto.deriveKey(oldPw, account.salt, account.iter);
    try { await RS.crypto.decryptJSON(oldKey, account.verifier); } catch (e) { throw new Error('Senha atual incorreta.'); }
    const salt = RS.crypto.randomSalt();
    const key = await RS.crypto.deriveKey(newPw, salt);
    const updated = Object.assign({}, account, { salt, iter: RS.crypto.ITER, verifier: await RS.crypto.encryptJSON(key, VERIFY) });
    await put('vaults', { id: account.id, box: await RS.crypto.encryptJSON(key, session.data) });
    await put('accounts', updated);
    session.account = updated; session.key = key;
  }

  async function updateAccountName(name) {
    const updated = Object.assign({}, session.account, { name });
    await put('accounts', updated);
    session.account = updated;
    session.data.profile.name = name;
    save();
  }

  async function deleteAccount() {
    const id = session.account.id;
    await del('vaults', id);
    await del('accounts', id);
    session.account = null; session.key = null; session.data = null;
  }

  async function deleteAccountByEmail(email) {
    const a = await findByEmail(email);
    if (!a) return false;
    await del('vaults', a.id); await del('accounts', a.id);
    return true;
  }

  /* ----- Registros (pensamentos) ----- */
  const records = () => session.data.records;
  const getRecord = (id) => records().find((r) => r.id === id) || null;
  function upsertRecord(r) {
    r.updatedAt = new Date().toISOString();
    const i = records().findIndex((x) => x.id === r.id);
    if (i >= 0) records()[i] = r; else records().push(r);
    save();
    return r;
  }
  function deleteRecord(id) {
    session.data.records = records().filter((r) => r.id !== id);
    save();
  }
  function newRecord() {
    const now = new Date().toISOString();
    return {
      id: RS.uid(), type: 'pensamento', status: 'rascunho', step: 1, createdAt: now, updatedAt: now, when: now,
      situacao: '', contexto: '', pensamentos: [''], emocoes: [], sensacoes: '', comportamento: '',
      evidFavor: '', evidContra: '', outrasExplic: '', alguemQuerido: '', distorcoes: [],
      alternativo: '', planoAcao: '', crencaAntes: [50], crencaDepois: [null], notas: '', persisted: false,
    };
  }

  /* ----- Check-ins (Meu momento) ----- */
  const checkins = () => session.data.checkins;
  function upsertCheckin(c) {
    c.updatedAt = new Date().toISOString();
    const i = checkins().findIndex((x) => x.id === c.id);
    if (i >= 0) checkins()[i] = c; else checkins().push(c);
    save();
  }
  function deleteCheckin(id) { session.data.checkins = checkins().filter((c) => c.id !== id); save(); }

  function exportData() {
    const { account, data } = session;
    return {
      app: 'ReSignifica', exportedAt: new Date().toISOString(), formatVersion: 1,
      account: { name: account.name, email: account.email, createdAt: account.createdAt },
      consent: data.consent, settings: data.settings,
      records: data.records.filter((r) => r.persisted !== false),
      checkins: data.checkins,
    };
  }

  async function hasAccounts() { return (await getAll('accounts')).length > 0; }

  async function requestPersistence() {
    try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) { /* ignora */ }
    return false;
  }

  RS.store = {
    session, createAccount, login, logout, save, saveNow, changePassword, updateAccountName, deleteAccount, deleteAccountByEmail,
    records, getRecord, upsertRecord, deleteRecord, newRecord,
    checkins, upsertCheckin, deleteCheckin, exportData, hasAccounts, requestPersistence,
  };
})(window.RS);
