// ---------- Dashboard (UC — Consultar Dashboard) ----------

async function carregarMotoristasFiltro() {
  const sel = document.getElementById('motorista_id');
  const lista = await API.get('/motoristas');
  lista.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nome;
    sel.appendChild(opt);
  });
}

function periodoMesAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { inicio: fmt(inicio), fim: fmt(hoje) };
}

async function carregarDashboard() {
  const inicio = document.getElementById('inicio').value;
  const fim = document.getElementById('fim').value;
  const motoristaId = document.getElementById('motorista_id').value;

  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  if (motoristaId) params.set('motorista_id', motoristaId);

  const destino = document.getElementById('conteudo-dashboard');
  destino.innerHTML = '<p class="estado-vazio">Carregando indicadores…</p>';

  try {
    const dados = await API.get('/dashboard?' + params.toString());
    renderizarDashboard(dados);
  } catch (e) {
    mostrarAlerta('alerta', 'Erro ao carregar indicadores: ' + e.message, 'erro');
    destino.innerHTML = '';
  }
}

function renderizarDashboard(dados) {
  const destino = document.getElementById('conteudo-dashboard');

  if (!dados.totalRegistros) {
    destino.innerHTML = '<p class="estado-vazio">Nenhum registro encontrado para o período selecionado. Ajuste o filtro.</p>';
    return;
  }

  destino.innerHTML = `
    <div class="kpis">
      <div class="kpi">
        <div class="kpi-label">Tempo total parado</div>
        <div class="kpi-valor">${dados.tempoTotalParadoHoras.toFixed(1)} h</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Custo consolidado</div>
        <div class="kpi-valor">${formatarMoeda(dados.custoTotal)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Jornada média/dia</div>
        <div class="kpi-valor">${dados.jornadaMediaHoras.toFixed(1)} h</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Roteiros no período</div>
        <div class="kpi-valor">${dados.totalRegistros}</div>
      </div>
    </div>

    <h3>Tempo parado por dia</h3>
    <div id="grafico-por-dia" class="grafico-barras"></div>

    <h3 style="margin-top:24px;">Comparativo entre roteiros</h3>
    <div id="grafico-comparativo" class="grafico-barras"></div>
  `;

  desenharBarras('grafico-por-dia', dados.tempoParadoPorDia.map((d) => ({
    label: new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    valor: d.horasParadas
  })));

  desenharBarras('grafico-comparativo', dados.comparativoRoteiros.map((r) => ({
    label: r.roteiro,
    valor: r.horasParadas
  })));
}

// Gráfico de barras simples em CSS puro — sem dependência externa
function desenharBarras(idContainer, pontos) {
  const container = document.getElementById(idContainer);
  if (!pontos.length) {
    container.innerHTML = '<p class="estado-vazio">Sem dados suficientes para o gráfico.</p>';
    return;
  }
  const max = Math.max(...pontos.map((p) => p.valor), 0.1);
  container.innerHTML = pontos.map((p) => `
    <div class="barra-col">
      <span class="barra-valor">${p.valor.toFixed(1)}h</span>
      <div class="barra" style="height:${Math.max(4, (p.valor / max) * 100)}%"></div>
      <span class="barra-label">${p.label}</span>
    </div>
  `).join('');
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function irParaHistorico() {
  window.location.href = 'historico.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarMotoristasFiltro();
  const { inicio, fim } = periodoMesAtual();
  document.getElementById('inicio').value = inicio;
  document.getElementById('fim').value = fim;
  carregarDashboard();
});
