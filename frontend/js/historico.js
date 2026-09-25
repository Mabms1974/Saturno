// ---------- Histórico / Relatórios (UC03) ----------

async function carregarMotoristasFiltroHistorico() {
  const sel = document.getElementById('motorista_id');
  const lista = await API.get('/motoristas');
  lista.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nome;
    sel.appendChild(opt);
  });
}

function filtroAtual() {
  const inicio = document.getElementById('inicio').value;
  const fim = document.getElementById('fim').value;
  const motoristaId = document.getElementById('motorista_id').value;

  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  if (motoristaId) params.set('motorista_id', motoristaId);
  return params;
}

async function carregarHistorico() {
  const tbody = document.querySelector('#tabela-historico tbody');
  const vazio = document.getElementById('vazio-historico');
  tbody.innerHTML = '';

  const linhas = await API.get('/relatorios/historico?' + filtroAtual().toString());

  if (!linhas.length) {
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  linhas.forEach((l) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${l.roteiro_id}</td>
      <td>${l.motorista}</td>
      <td>${new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td>${l.tempo_parado_horas.toFixed(1)} h</td>
      <td>${formatarMoeda(l.custo)}</td>
      <td>${l.jornada_horas.toFixed(1)} h</td>
      <td>${l.horas_extras.toFixed(1)} h</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportarCsv() {
  const params = filtroAtual();
  window.location.href = '/api/relatorios/exportar?' + params.toString();
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarMotoristasFiltroHistorico();
  carregarHistorico();
});
