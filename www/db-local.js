/* Banco local do tablet (localStorage) com a mesma interface usada pelo app.
   Versao 1 do APK: cada tablet guarda os proprios dados.
   Quando o Supabase for ligado, este arquivo e trocado por um adaptador Supabase. */
(function () {
  var K = 'spp_db_', L = {};
  function rd(p) { try { var v = localStorage.getItem(K + p); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function wr(p, v) { localStorage.setItem(K + p, JSON.stringify(v)); }
  function keys() { var o = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(K) === 0) o.push(k.slice(K.length)); } return o; }
  var db = {
    doc: function (p) {
      return {
        get: async function () { var v = rd(p); return { exists: v !== null, data: function () { return v; } }; },
        set: async function (v) { wr(p, v); (L[p] || []).forEach(function (f) { f({ exists: true, data: function () { return v; } }); }); },
        onSnapshot: function (cb) { (L[p] = L[p] || []).push(cb); var v = rd(p); cb({ exists: v !== null, data: function () { return v; } }); return function () {}; }
      };
    },
    collection: function (n) {
      return { get: async function () {
        return { docs: keys().filter(function (k) { return k.indexOf(n + '/') === 0; }).map(function (k) { return { id: k.slice(n.length + 1), data: function () { return rd(k); } }; }) };
      } };
    }
  };
  if (!window.claude) window.claude = { use: async function () { return db; } };
})();
