// ---------- Cadastro de roteiros ----------

async function carregarMotoristasSelect() {
  const sel = document.getElementById('motorista_id');
  sel.innerHTML = '<option value="">— Selecione —</option>';
  const lista = await API.get('/motoristas');
  lista.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nome + (m.veiculo ? ` (${m.veiculo})` : '');
    sel.appendChild(opt);
  });
}

async function carregarRoteiros() {
  const tbody = document.querySelector('#tabela-roteiros tbody');
  const vazio = document.getElementById('vazio-roteiros');
  tbody.innerHTML = '';

  const lista = await API.get('/roteiros');

  if (!lista.length) {
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  // Para cada roteiro, busca os detalhes (para pegar nº de pontos e tempo total)
  for (const r of lista) {
    const detalhe = await API.get('/roteiros/' + r.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td>${r.motorista_nome}</td>
      <td>${r.distancia_total_km || 0} km</td>
      <td>${detalhe.pontos.length}</td>
      <td>${formatarMinutos(detalhe.tempo_total_parado_min)}</td>
      <td><button class="btn btn-vermelho" data-id="${r.id}">Excluir</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => excluirRoteiro(r.id));
    tbody.appendChild(tr);
  }
}

async function excluirRoteiro(id) {
  if (!confirm('Excluir este roteiro e todos os seus pontos?')) return;
  try {
    await API.del('/roteiros/' + id);
    mostrarAlerta('alerta', 'Roteiro excluído.', 'ok');
    carregarRoteiros();
  } catch (e) {
    mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarMotoristasSelect();

  // data padrão = hoje
  document.getElementById('data').valueAsDate = new Date();

  carregarRoteiros();

  document.getElementById('form-roteiro').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = {
      data:               document.getElementById('data').value,
      motorista_id:       parseInt(document.getElementById('motorista_id').value, 10),
      distancia_total_km: parseFloat(document.getElementById('distancia_total_km').value) || 0
    };
    if (!dados.motorista_id) {
      mostrarAlerta('alerta', 'Selecione um motorista.', 'erro');
      return;
    }
    try {
      await API.post('/roteiros', dados);
      mostrarAlerta('alerta', 'Roteiro criado com sucesso!', 'ok');
      document.getElementById('form-roteiro').reset();
      document.getElementById('data').valueAsDate = new Date();
      carregarRoteiros();
    } catch (e) {
      mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
    }
  });
});