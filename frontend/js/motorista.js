// ---------- Cadastro de motoristas ----------

async function carregarMotoristas() {
  const tbody = document.querySelector('#tabela-motoristas tbody');
  const vazio = document.getElementById('vazio-motoristas');
  tbody.innerHTML = '';

  const lista = await API.get('/motoristas');

  if (!lista.length) {
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  lista.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.nome}</td>
      <td>${m.telefone || '—'}</td>
      <td>${m.documento || '—'}</td>
      <td>${m.veiculo || '—'}</td>
      <td>${m.rendimento_km_l || '—'}</td>
      <td>
        <button class="btn btn-vermelho" data-id="${m.id}">Excluir</button>
      </td>
    `;
    tr.querySelector('button').addEventListener('click', () => excluirMotorista(m.id, m.nome));
    tbody.appendChild(tr);
  });
}

async function excluirMotorista(id, nome) {
  if (!confirm(`Excluir motorista "${nome}"?`)) return;
  try {
    await API.del('/motoristas/' + id);
    mostrarAlerta('alerta', 'Motorista excluído.', 'ok');
    carregarMotoristas();
  } catch (e) {
    mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
  }
}

function limparFormulario() {
  document.getElementById('form-motorista').reset();
}

document.addEventListener('DOMContentLoaded', () => {
  carregarMotoristas();

  document.getElementById('form-motorista').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = {
      nome:            document.getElementById('nome').value.trim(),
      telefone:        document.getElementById('telefone').value.trim() || null,
      documento:       document.getElementById('documento').value.trim() || null,
      veiculo:         document.getElementById('veiculo').value.trim() || null,
      rendimento_km_l: parseFloat(document.getElementById('rendimento_km_l').value) || null
    };

    try {
      await API.post('/motoristas', dados);
      mostrarAlerta('alerta', 'Motorista salvo com sucesso!', 'ok');
      limparFormulario();
      carregarMotoristas();
    } catch (e) {
      mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
    }
  });
});