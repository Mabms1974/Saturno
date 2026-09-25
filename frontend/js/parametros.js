// ---------- Parametrização de Custos/Jornada (UC02) ----------

async function carregarVigente() {
  try {
    const p = await API.get('/parametros/vigente');
    if (p.preco_combustivel != null) {
      document.getElementById('preco_combustivel').value = p.preco_combustivel;
      document.getElementById('jornada_horas_dia').value = p.jornada_horas_dia;
    }
  } catch (e) {
    mostrarAlerta('alerta', 'Erro ao carregar parâmetro vigente: ' + e.message, 'erro');
  }
}

async function carregarHistoricoParametros() {
  const tbody = document.querySelector('#tabela-parametros tbody');
  const vazio = document.getElementById('vazio-parametros');
  tbody.innerHTML = '';

  const lista = await API.get('/parametros/historico');

  if (!lista.length) {
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  lista.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatarMoeda(p.preco_combustivel)}</td>
      <td>${p.jornada_horas_dia} h</td>
      <td>${formatarDataHora(p.vigencia_inicio)}</td>
      <td>${p.vigencia_fim ? formatarDataHora(p.vigencia_fim) : '<strong>vigente</strong>'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarVigente();
  await carregarHistoricoParametros();

  document.getElementById('form-parametro').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = {
      preco_combustivel: parseFloat(document.getElementById('preco_combustivel').value),
      jornada_horas_dia: parseFloat(document.getElementById('jornada_horas_dia').value)
    };
    try {
      await API.post('/parametros', dados);
      mostrarAlerta('alerta', 'Parâmetros atualizados.', 'ok');
      carregarHistoricoParametros();
    } catch (e) {
      mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
    }
  });
});
