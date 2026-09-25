// ---------- Tela de campo: registrar chegada/saída ----------

let roteiroSelecionado = null;

async function carregarRoteiros() {
  const sel = document.getElementById('sel-roteiro');
  sel.innerHTML = '<option value="">— Selecione um roteiro —</option>';
  const lista = await API.get('/roteiros');
  lista.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')} — ${r.motorista_nome}`;
    sel.appendChild(opt);
  });
}

async function renderizarPontos(roteiroId) {
  const container = document.getElementById('pontos-container');
  const resumo    = document.getElementById('resumo');
  container.innerHTML = '';

  if (!roteiroId) { resumo.style.display = 'none'; return; }

  const detalhe = await API.get('/roteiros/' + roteiroId);
  roteiroSelecionado = detalhe;

  resumo.style.display = 'block';
  document.getElementById('resumo-texto').innerHTML = `
    <strong>${detalhe.motorista_nome}</strong> —
    ${new Date(detalhe.data + 'T00:00:00').toLocaleDateString('pt-BR')}<br>
    Total de pontos: <strong>${detalhe.pontos.length}</strong> |
    Tempo total parado: <strong>${formatarMinutos(detalhe.tempo_total_parado_min)}</strong>
  `;

  if (!detalhe.pontos.length) {
    container.innerHTML = '<div class="card"><p>Nenhum ponto cadastrado neste roteiro. Vá em <b>Pontos</b> para cadastrar.</p></div>';
    return;
  }

  detalhe.pontos.forEach(p => {
    const chegou = !!p.data_hora_chegada;
    const saiu   = !!p.data_hora_saida;
    const completo = chegou && saiu;
    const isPartida = p.ordem === 1;

    const cls = 'ponto-item' + (isPartida ? ' partida' : '') + (completo ? ' concluido' : '');

    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = `
      <div class="ponto-header">
        <h3>#${p.ordem} — ${p.endereco}</h3>
        ${isPartida ? '<span class="meta">Ponto de partida (não conta tempo)</span>' : ''}
      </div>
      <div class="meta">
        Chegada: <b>${formatarDataHora(p.data_hora_chegada)}</b> &nbsp;|&nbsp;
        Saída: <b>${formatarDataHora(p.data_hora_saida)}</b>
      </div>
      ${!isPartida ? `<div class="tempo">Tempo parado: ${formatarMinutos(p.tempo_parado_min)}</div>` : ''}

      <div class="acoes">
        <button class="btn btn-verde" data-acao="chegada" ${chegou ? 'disabled' : ''}>
          ${chegou ? '✓ Chegada registrada' : '📍 Registrar Chegada'}
        </button>
        <button class="btn btn-primary" data-acao="saida" ${!chegou || saiu ? 'disabled' : ''}>
          ${saiu ? '✓ Saída registrada' : '📍 Registrar Saída'}
        </button>
      </div>
    `;

    div.querySelector('[data-acao="chegada"]').addEventListener('click', (e) =>
      registrarChegada(p.id, roteiroId, e.target));
    div.querySelector('[data-acao="saida"]').addEventListener('click', (e) =>
      registrarSaida(p.id, roteiroId, e.target));

    container.appendChild(div);
  });
}

// ------------------------------------------------------------
// Captura de coordenadas do navegador (silenciosa, se negada
// não trava o fluxo — registra só a data/hora)
// ------------------------------------------------------------
function obterLocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    // Timeout curto para não travar a UI
    const timer = setTimeout(() => resolve(null), 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      () => {
        clearTimeout(timer);
        resolve(null); // usuário negou ou deu erro → segue sem coords
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

async function registrarChegada(pontoId, roteiroId, botao) {
  const textoOriginal = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML = '⏳ Capturando localização...';

  const coord = await obterLocalizacao();
  const agora = new Date().toISOString();

  try {
    await API.post(`/pontos/${pontoId}/chegada`, {
      data_hora_chegada: agora,
      latitude:  coord?.latitude  ?? null,
      longitude: coord?.longitude ?? null
    });

    const local = coord ? ' (com localização)' : '';
    mostrarAlerta('alerta', `Chegada registrada às ${formatarDataHora(agora)}${local}`, 'ok');
    renderizarPontos(roteiroId);
  } catch (e) {
    botao.disabled = false;
    botao.innerHTML = textoOriginal;
    mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
  }
}

async function registrarSaida(pontoId, roteiroId, botao) {
  const textoOriginal = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML = '⏳ Capturando localização...';

  const coord = await obterLocalizacao();
  const agora = new Date().toISOString();

  try {
    const atualizado = await API.post(`/pontos/${pontoId}/saida`, {
      data_hora_saida: agora,
      latitude:  coord?.latitude  ?? null,
      longitude: coord?.longitude ?? null
    });

    const msg = atualizado.ordem === 1
      ? 'Saída registrada (ponto de partida não conta tempo).'
      : `Saída registrada. Tempo parado: ${formatarMinutos(atualizado.tempo_parado_min)}`;
    mostrarAlerta('alerta', msg, 'ok');
    renderizarPontos(roteiroId);
  } catch (e) {
    botao.disabled = false;
    botao.innerHTML = textoOriginal;
    mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarRoteiros();
  document.getElementById('sel-roteiro').addEventListener('change', (ev) => {
    renderizarPontos(ev.target.value);
  });
});