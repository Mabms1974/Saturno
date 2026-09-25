// Helper único para todas as chamadas HTTP
const API = {
  base: '/api',

  async req(metodo, url, corpo) {
    const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
    if (corpo) opcoes.body = JSON.stringify(corpo);

    const resp = await fetch(this.base + url, opcoes);
    const texto = await resp.text();
    const json  = texto ? JSON.parse(texto) : null;

    if (!resp.ok) {
      throw new Error((json && json.erro) || `Erro HTTP ${resp.status}`);
    }
    return json;
  },

  get:  (url)        => API.req('GET',    url),
  post: (url, corpo) => API.req('POST',   url, corpo),
  put:  (url, corpo) => API.req('PUT',    url, corpo),
  del:  (url)        => API.req('DELETE', url)
};

// ---------- Helpers de UI ----------

// Marca o link ativo no nav
function marcarNavAtivo() {
  const atual = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === atual) a.classList.add('ativo');
  });
}

// Exibe mensagem de alerta
function mostrarAlerta(idEl, msg, tipo = 'info') {
  const el = document.getElementById(idEl);
  if (!el) return;
  el.className = 'alerta ' + tipo;
  el.textContent = msg;
  el.style.display = 'block';
  if (tipo === 'ok') {
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

// Formata data/hora ISO -> "dd/mm/aaaa hh:mm"
function formatarDataHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Formata minutos -> "1h 25min"
function formatarMinutos(min) {
  if (!min) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

// Gera string "YYYY-MM-DDTHH:mm" com o horário atual (para input datetime-local)
function agoraLocalInput() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.addEventListener('DOMContentLoaded', marcarNavAtivo);