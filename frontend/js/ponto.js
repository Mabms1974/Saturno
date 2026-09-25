// ---------- Cadastro e listagem de pontos ----------

async function carregarRoteirosSelects() {
  const lista = await API.get('/roteiros');

  const selCad  = document.getElementById('roteiro_id');
  const selFilt = document.getElementById('filtro-roteiro');

  selCad.innerHTML  = '<option value="">— Selecione —</option>';
  selFilt.innerHTML = '<option value="">— Selecione um roteiro —</option>';

  lista.forEach(r => {
    const label = `${new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')} — ${r.motorista_nome}`;

    const o1 = document.createElement('option');
    o1.value = r.id; o1.textContent = label;
    selCad.appendChild(o1);

    const o2 = document.createElement('option');
    o2.value = r.id; o2.textContent = label;
    selFilt.appendChild(o2);
  });

  selFilt.addEventListener('change', () => listarPontos(selFilt.value));
}

async function listarPontos(roteiroId) {
  const container = document.getElementById('lista-pontos');
  if (!roteiroId) { container.innerHTML = ''; return; }

  const pontos = await API.get(`/pontos/roteiro/${roteiroId}`);

  if (!pontos.length) {
    container.innerHTML = '<p style="color:#666;">Nenhum ponto neste roteiro ainda.</p>';
    return;
  }

  container.innerHTML = '';
  pontos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'ponto-item' + (p.ordem === 1 ? ' partida' : '');

    const coords = (p.latitude && p.longitude)
      ? `📍 ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
      : '📍 sem coordenadas';

    div.innerHTML = `
      <div class="ponto-header">
        <h3>#${p.ordem} — ${p.endereco}</h3>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-sec" data-acao="editar" data-id="${p.id}">Editar</button>
          <button class="btn btn-vermelho" data-acao="excluir" data-id="${p.id}">Excluir</button>
        </div>
      </div>
      <div class="meta">
        ${coords}<br>
        Chegada: ${formatarDataHora(p.data_hora_chegada)} |
        Saída: ${formatarDataHora(p.data_hora_saida)}
      </div>
      <div class="tempo">
        ${p.ordem === 1 ? 'Ponto de partida — não conta tempo parado' : 'Tempo parado: ' + formatarMinutos(p.tempo_parado_min)}
      </div>
    `;

    div.querySelector('[data-acao="editar"]').addEventListener('click',  () => abrirModalEdicao(p, roteiroId));
    div.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
      if (!confirm('Excluir este ponto?')) return;
      await API.del('/pontos/' + p.id);
      listarPontos(roteiroId);
    });

    container.appendChild(div);
  });
}

// ------------------------------------------------------------
// Geolocalização: usa navigator.geolocation + Nominatim (OSM)
// ------------------------------------------------------------
async function usarMinhaLocalizacao() {
  const status = document.getElementById('geo-status');

  if (!navigator.geolocation) {
    status.textContent = '❌ Navegador não suporta geolocalização';
    return;
  }

  status.textContent = '⏳ Obtendo localização...';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      document.getElementById('latitude').value  = lat.toFixed(6);
      document.getElementById('longitude').value = lon.toFixed(6);

      status.textContent = '📡 Buscando endereço...';

      // Geocodificação reversa via Nominatim (OSM) — gratuito, sem chave
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        const resp = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();

        if (data && data.display_name) {
          // Pega um endereço mais curto: rua + número, se disponível
          const a = data.address || {};
          const partes = [
            a.road || a.pedestrian || a.footway,
            a.house_number,
            a.suburb || a.neighbourhood,
            a.city || a.town || a.village
          ].filter(Boolean);

          const enderecoCurto = partes.length
            ? partes.join(', ')
            : data.display_name.split(',').slice(0, 3).join(',').trim();

          document.getElementById('endereco').value = enderecoCurto;
          status.textContent = '✅ Localização e endereço preenchidos';
        } else {
          status.textContent = '✅ Coordenadas capturadas';
        }
      } catch (e) {
        status.textContent = '✅ Coordenadas capturadas (endereço não encontrado)';
      }

      setTimeout(() => { status.textContent = ''; }, 4000);
    },
    (err) => {
      status.textContent = '❌ ' + err.message;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ------------------------------------------------------------
// Modal de edição de ponto
// ------------------------------------------------------------
function abrirModalEdicao(ponto, roteiroId) {
  // Se já existe um modal aberto, remove
  document.getElementById('modal-edicao')?.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-edicao';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(15,23,42,.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  `;

  modal.innerHTML = `
    <div style="background:#fff; border-radius:14px; padding:24px; max-width:520px; width:100%;
                box-shadow: 0 20px 50px rgba(0,0,0,.25); max-height:90vh; overflow-y:auto;">
      <h2 style="margin:0 0 16px; font-size:1.05rem; color:var(--primary);">
        Editar ponto #${ponto.ordem}
      </h2>

      <label>Endereço</label>
      <input type="text" id="edit-endereco" value="${ponto.endereco || ''}">

      <div style="display:flex; gap:10px; margin-top:6px;">
        <div style="flex:1;">
          <label>Latitude</label>
          <input type="number" id="edit-lat" step="any" value="${ponto.latitude ?? ''}">
        </div>
        <div style="flex:1;">
          <label>Longitude</label>
          <input type="number" id="edit-lon" step="any" value="${ponto.longitude ?? ''}">
        </div>
      </div>

      <div class="acoes" style="margin-top:20px; justify-content:flex-end;">
        <button class="btn btn-sec" id="edit-cancelar">Cancelar</button>
        <button class="btn btn-primary" id="edit-salvar">Salvar alterações</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('edit-cancelar').addEventListener('click', () => modal.remove());

  document.getElementById('edit-salvar').addEventListener('click', async () => {
    const dados = {
      endereco:  document.getElementById('edit-endereco').value.trim(),
      latitude:  parseFloat(document.getElementById('edit-lat').value)  || null,
      longitude: parseFloat(document.getElementById('edit-lon').value) || null
    };

    if (!dados.endereco) {
      alert('Endereço é obrigatório.');
      return;
    }

    try {
      await API.put('/pontos/' + ponto.id, dados);
      modal.remove();
      mostrarAlerta('alerta', 'Ponto atualizado com sucesso!', 'ok');
      listarPontos(roteiroId);
    } catch (e) {
      alert('Erro ao salvar: ' + e.message);
    }
  });
}

// ------------------------------------------------------------
// Inicialização da página
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await carregarRoteirosSelects();

  document.getElementById('btn-geo').addEventListener('click', usarMinhaLocalizacao);

  document.getElementById('form-ponto').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = {
      roteiro_id: parseInt(document.getElementById('roteiro_id').value, 10),
      endereco:   document.getElementById('endereco').value.trim(),
      latitude:   parseFloat(document.getElementById('latitude').value)  || null,
      longitude:  parseFloat(document.getElementById('longitude').value) || null
    };
    if (!dados.roteiro_id) {
      mostrarAlerta('alerta', 'Selecione um roteiro.', 'erro');
      return;
    }
    try {
      await API.post('/pontos', dados);
      mostrarAlerta('alerta', 'Ponto adicionado!', 'ok');
      document.getElementById('form-ponto').reset();
      document.getElementById('geo-status').textContent = '';
      document.getElementById('filtro-roteiro').value = dados.roteiro_id;
      listarPontos(dados.roteiro_id);
    } catch (e) {
      mostrarAlerta('alerta', 'Erro: ' + e.message, 'erro');
    }
  });
});