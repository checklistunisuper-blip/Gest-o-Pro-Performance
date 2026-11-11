/* Banco central do app (Supabase) com a mesma interface do banco local anterior.
   Todos os tablets leem e gravam no mesmo lugar: ranking, vendas, escalas,
   fechamentos e certificados ficam iguais em todos.
   Mantido com o nome db-local.js para nao mexer no index.html.
   A chave abaixo e a chave PUBLICA (publishable). Nunca coloque a chave secret/service_role aqui. */
(function () {
  var URL = 'https://rzjldjojpcwdupuyebff.supabase.co';
  var KEY = 'sb_publishable_bQwKGdLdUknPUSKZxuyCbQ_VC49jlpP';
  var REST = URL + '/rest/v1/docs';
  var C = 'spp_c_';      // copia local (para o app abrir mesmo se a internet cair)
  var OLD = 'spp_db_';   // dados da versao 1 (guardados so no tablet)
  var POLL = 3000;       // confere mudancas de outros tablets a cada 3 s
  var L = {}, SIG = {};

  function H(x) { var h = { apikey: KEY }; for (var k in x) h[k] = x[k]; return h; }
  async function api(url, opt) {
    var r = await fetch(url, opt);
    if (!r.ok) { var t = ''; try { t = await r.text(); } catch (e) {} throw new Error('Supabase ' + r.status + ' ' + t.slice(0, 200)); }
    return r;
  }
  function cget(p) { try { var v = localStorage.getItem(C + p); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function cset(p, v) { try { localStorage.setItem(C + p, JSON.stringify(v)); } catch (e) {} }
  function snap(v) { return { exists: v !== null && v !== undefined, data: function () { return v; } }; }
  function enc(p) { return encodeURIComponent(p); }

  async function rget(p) {
    var r = await api(REST + '?path=eq.' + enc(p) + '&select=data,updated_at', { headers: H() });
    var a = await r.json(); return a.length ? a[0] : null;
  }
  async function rver(p) {
    var r = await api(REST + '?path=eq.' + enc(p) + '&select=updated_at', { headers: H() });
    var a = await r.json(); return a.length ? a[0].updated_at : null;
  }
  async function rset(p, v) {
    var r = await api(REST + '?on_conflict=path', {
      method: 'POST',
      headers: H({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({ path: p, data: v })
    });
    var a = await r.json(); return a[0];
  }

  // Sobe uma unica vez os dados que ja estavam guardados neste tablet (versao 1),
  // somente se o banco central ainda estiver vazio.
  var ready = (async function () {
    try {
      if (localStorage.getItem('spp_migrado')) return;
      var rows = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(OLD) === 0) {
          try { rows.push({ path: k.slice(OLD.length), data: JSON.parse(localStorage.getItem(k)) }); } catch (e) {}
        }
      }
      var ex = await rver('estado/atual');
      if (!ex && rows.length) {
        await api(REST + '?on_conflict=path', {
          method: 'POST',
          headers: H({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
          body: JSON.stringify(rows)
        });
      }
      localStorage.setItem('spp_migrado', '1');
    } catch (e) { /* sem internet agora: tenta de novo na proxima abertura */ }
  })();

  var db = {
    doc: function (p) {
      return {
        get: async function () {
          await ready;
          try {
            var row = await rget(p);
            if (row) { SIG[p] = row.updated_at; cset(p, row.data); }
            return snap(row ? row.data : null);
          } catch (e) {
            var c = cget(p);
            if (c !== null) return snap(c);
            throw e;
          }
        },
        set: async function (v) {
          await ready;
          var row = await rset(p, v);
          if (row) SIG[p] = row.updated_at;
          cset(p, v);
          (L[p] || []).forEach(function (f) { f(snap(v)); });
        },
        onSnapshot: function (cb) {
          var alive = true, busy = false, first = true;
          (L[p] = L[p] || []).push(cb);
          async function tick() {
            if (!alive || busy) return; busy = true;
            try {
              await ready;
              var ver = await rver(p);
              if (first || ver !== SIG[p]) {
                if (ver === null) { SIG[p] = null; if (alive) cb(snap(null)); }
                else { var row = await rget(p); if (!alive) return; SIG[p] = row.updated_at; cset(p, row.data); cb(snap(row.data)); }
              }
              first = false;
            } catch (e) {
              if (first) { var c = cget(p); if (c !== null) { first = false; if (alive) cb(snap(c)); } }
            } finally { busy = false; }
          }
          tick();
          var t = setInterval(tick, POLL);
          return function () {
            alive = false; clearInterval(t);
            L[p] = (L[p] || []).filter(function (f) { return f !== cb; });
          };
        }
      };
    },
    collection: function (n) {
      return {
        get: async function () {
          await ready;
          try {
            var r = await api(REST + '?path=like.' + enc(n + '/') + '*&select=path,data&limit=5000', { headers: H() });
            var a = await r.json();
            return { docs: a.map(function (x) { cset(x.path, x.data); return { id: x.path.slice(n.length + 1), data: function () { return x.data; } }; }) };
          } catch (e) {
            var out = [];
            for (var i = 0; i < localStorage.length; i++) {
              var k = localStorage.key(i);
              if (k && k.indexOf(C + n + '/') === 0) {
                (function (kk) { out.push({ id: kk.slice(C.length + n.length + 1), data: function () { return cget(kk.slice(C.length)); } }); })(k);
              }
            }
            if (out.length) return { docs: out };
            throw e;
          }
        }
      };
    }
  };
  if (!window.claude) window.claude = { use: async function () { return db; } };
})();
