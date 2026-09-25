/* ============================================================
   Testes automatizados — MVP Tempo Parado
   Cobre: cadastros, registro de campo e regras de negócio
   Executa em banco separado (data/test.db), sem afetar o real.
   ============================================================ */

// ⚠️ Deve ser a PRIMEIRA coisa antes de qualquer require do app
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const TEST_DB = path.join(DATA_DIR, 'test.db');
process.env.DB_PATH = TEST_DB;

// Limpa resquícios de execuções anteriores
for (const sufixo of ['', '-wal', '-shm']) {
  const f = TEST_DB + sufixo;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

// Agora sim, podemos carregar app e banco
const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const db  = require('../db/connection');

// ------------------------------------------------------------
// Infra dos testes
// ------------------------------------------------------------

let server;
let baseURL;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseURL = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
});

// Limpa tabelas antes de cada teste — evita interferência
beforeEach(() => {
  db.exec('DELETE FROM ponto; DELETE FROM roteiro; DELETE FROM motorista;');
});

// Helper para chamar a API
async function api(metodo, rota, corpo) {
  const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (corpo) opcoes.body = JSON.stringify(corpo);
  const resp = await fetch(baseURL + rota, opcoes);
  const texto = await resp.text();
  const json = texto ? JSON.parse(texto) : null;
  return { status: resp.status, body: json };
}

// Helpers de criação rápida
async function criarMotorista(nome = 'João Teste') {
  const r = await api('POST', '/api/motoristas', { nome });
  assert.equal(r.status, 201);
  return r.body;
}

async function criarRoteiro(motoristaId, data = '2026-09-22') {
  const r = await api('POST', '/api/roteiros', { data, motorista_id: motoristaId });
  assert.equal(r.status, 201);
  return r.body;
}

async function criarPonto(roteiroId, endereco, chegada = null, saida = null) {
  const r = await api('POST', '/api/pontos', {
    roteiro_id: roteiroId,
    endereco,
    data_hora_chegada: chegada,
    data_hora_saida:   saida
  });
  assert.equal(r.status, 201);
  return r.body;
}

// ============================================================
// RN01 — Ponto de partida NÃO conta tempo parado
// ============================================================
describe('RN01 — Ponto de partida não conta tempo parado', () => {

  test('Ponto de ordem 1 sempre retorna tempo_parado_min = 0', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);

    const p1 = await criarPonto(
      r.id, 'Seg. Família (partida)',
      '2026-09-22T08:00:00', '2026-09-22T08:30:00'
    );

    assert.equal(p1.ordem, 1, 'Primeiro ponto deve ser ordem 1');
    assert.equal(
      p1.tempo_parado_min, 0,
      'RN01: ponto de partida deve ter tempo parado ZERO mesmo com 30min de diferença'
    );
  });

  test('Registrar chegada/saída via API no ponto 1 mantém tempo 0', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    const p = await criarPonto(r.id, 'Partida');

    await api('POST', `/api/pontos/${p.id}/chegada`, { data_hora_chegada: '2026-09-22T08:00:00' });
    const saida = await api('POST', `/api/pontos/${p.id}/saida`,   { data_hora_saida:   '2026-09-22T09:00:00' });

    assert.equal(saida.status, 200);
    assert.equal(
      saida.body.tempo_parado_min, 0,
      'RN01: mesmo após 1h parado, ponto de partida não acumula tempo'
    );
  });
});

// ============================================================
// RN02 — Tempo parado = saída − chegada
// ============================================================
describe('RN02 — Tempo parado = saída − chegada', () => {

  test('Diferença exata em minutos é calculada corretamente', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);

    // Primeiro cria a partida (ordem 1)
    await criarPonto(r.id, 'Partida', '2026-09-22T07:00:00', '2026-09-22T07:00:00');

    // Ponto 2: chegada 08:00, saída 08:15 → 15 min
    const p2 = await criarPonto(
      r.id, 'Rua Peru, 55',
      '2026-09-22T08:00:00', '2026-09-22T08:15:00'
    );

    assert.equal(p2.ordem, 2);
    assert.equal(p2.tempo_parado_min, 15);
  });

  test('1h e 25min → 85 minutos', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    await criarPonto(r.id, 'Partida', null, null);

    const p = await criarPonto(
      r.id, 'Av. João César',
      '2026-09-22T08:00:00', '2026-09-22T09:25:00'
    );

    assert.equal(p.tempo_parado_min, 85);
  });

  test('Saída antes da chegada → 0 (dado inválido é ignorado)', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    await criarPonto(r.id, 'Partida', null, null);

    const p = await criarPonto(
      r.id, 'Ponto esquisito',
      '2026-09-22T10:00:00', '2026-09-22T09:00:00'
    );

    assert.equal(p.tempo_parado_min, 0);
  });

  test('Registrar saída via API recalcula o tempo automaticamente', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    await criarPonto(r.id, 'Partida', null, null);

    const p = await criarPonto(r.id, 'Cliente');
    assert.equal(p.tempo_parado_min, 0, 'Sem horários, tempo deve ser 0');

    await api('POST', `/api/pontos/${p.id}/chegada`, { data_hora_chegada: '2026-09-22T10:00:00' });
    const saida = await api('POST', `/api/pontos/${p.id}/saida`,   { data_hora_saida:   '2026-09-22T10:45:00' });

    assert.equal(saida.body.tempo_parado_min, 45);
  });
});

// ============================================================
// RN03 — Tempo total do roteiro = soma exceto partida
// ============================================================
describe('RN03 — Tempo total do roteiro', () => {

  test('Soma todos os pontos, menos o ponto de partida (ordem 1)', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);

    await criarPonto(r.id, 'Partida',          '2026-09-22T07:00:00', '2026-09-22T08:30:00'); // ignorado
    await criarPonto(r.id, 'Rua Peru, 55',      '2026-09-22T08:45:00', '2026-09-22T09:00:00'); // 15
    await criarPonto(r.id, 'Rua X, 5',          '2026-09-22T09:10:00', '2026-09-22T09:20:00'); // 10
    await criarPonto(r.id, 'Av. João César',    '2026-09-22T09:30:00', '2026-09-22T10:20:00'); // 50

    const detalhe = await api('GET', `/api/roteiros/${r.id}`);

    assert.equal(detalhe.status, 200);
    assert.equal(detalhe.body.pontos.length, 4);
    assert.equal(
      detalhe.body.tempo_total_parado_min,
      75,
      'RN03: 15 + 10 + 50 = 75 (partida ignorada)'
    );
  });

  test('Roteiro sem pontos (só partida) tem tempo total 0', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    await criarPonto(r.id, 'Partida', '2026-09-22T07:00:00', '2026-09-22T07:30:00');

    const detalhe = await api('GET', `/api/roteiros/${r.id}`);
    assert.equal(detalhe.body.tempo_total_parado_min, 0);
  });
});

// ============================================================
// RN06 — Ordem sequencial automática
// ============================================================
describe('RN06 — Ordem sequencial dos pontos', () => {

  test('Pontos recebem ordem 1, 2, 3, 4 automaticamente', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);

    const p1 = await criarPonto(r.id, 'A');
    const p2 = await criarPonto(r.id, 'B');
    const p3 = await criarPonto(r.id, 'C');
    const p4 = await criarPonto(r.id, 'D');

    assert.equal(p1.ordem, 1);
    assert.equal(p2.ordem, 2);
    assert.equal(p3.ordem, 3);
    assert.equal(p4.ordem, 4);
  });

  test('Listar pontos retorna sempre na ordem sequencial', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);

    await criarPonto(r.id, 'Primeiro');
    await criarPonto(r.id, 'Segundo');
    await criarPonto(r.id, 'Terceiro');

    const lista = await api('GET', `/api/pontos/roteiro/${r.id}`);
    assert.equal(lista.status, 200);

    const ordens = lista.body.map(p => p.ordem);
    assert.deepEqual(ordens, [1, 2, 3]);
  });
});

// ============================================================
// CRUD — Motorista
// ============================================================
describe('CRUD Motorista', () => {

  test('Criar retorna 201 e persiste no banco', async () => {
    const r = await api('POST', '/api/motoristas', {
      nome: 'Maria',
      telefone: '31999990000',
      documento: '12345678900',
      veiculo: 'CG 160',
      rendimento_km_l: 35
    });

    assert.equal(r.status, 201);
    assert.ok(r.body.id);
    assert.equal(r.body.nome, 'Maria');
    assert.equal(r.body.rendimento_km_l, 35);
  });

  test('Nome é obrigatório (RN de validação)', async () => {
    const r = await api('POST', '/api/motoristas', { telefone: '1234' });
    assert.equal(r.status, 400);
    assert.match(r.body.erro, /Nome/i);
  });

  test('Listar retorna todos os motoristas', async () => {
    await criarMotorista('Ana');
    await criarMotorista('Bruno');
    const r = await api('GET', '/api/motoristas');
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 2);
  });

  test('Atualizar altera os dados', async () => {
    const m = await criarMotorista('Carlos');
    const r = await api('PUT', `/api/motoristas/${m.id}`, {
      nome: 'Carlos Atualizado',
      veiculo: 'Fazer 250'
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.nome, 'Carlos Atualizado');
    assert.equal(r.body.veiculo, 'Fazer 250');
  });

  test('Excluir remove do banco', async () => {
    const m = await criarMotorista('Dora');
    const del = await api('DELETE', `/api/motoristas/${m.id}`);
    assert.equal(del.status, 204);

    const busca = await api('GET', `/api/motoristas/${m.id}`);
    assert.equal(busca.status, 404);
  });
});

// ============================================================
// CRUD — Roteiro
// ============================================================
describe('CRUD Roteiro', () => {

  test('Criar exige data e motorista_id', async () => {
    const semData = await api('POST', '/api/roteiros', { motorista_id: 1 });
    assert.equal(semData.status, 400);

    const semMotorista = await api('POST', '/api/roteiros', { data: '2026-09-22' });
    assert.equal(semMotorista.status, 400);
  });

  test('Criar roteiro com motorista válido funciona (RN05)', async () => {
    const m = await criarMotorista('Eduardo');
    const r = await criarRoteiro(m.id, '2026-09-23');

    assert.equal(r.data, '2026-09-23');
    assert.equal(r.motorista_id, m.id);
    assert.equal(r.motorista_nome, 'Eduardo');
  });

  test('Detalhe do roteiro traz pontos ordenados e tempo total', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    await criarPonto(r.id, 'A', null, null);
    await criarPonto(r.id, 'B', '2026-09-22T10:00:00', '2026-09-22T10:20:00');

    const det = await api('GET', `/api/roteiros/${r.id}`);
    assert.equal(det.status, 200);
    assert.equal(det.body.pontos.length, 2);
    assert.equal(det.body.tempo_total_parado_min, 20);
  });
});

// ============================================================
// CRUD — Ponto
// ============================================================
describe('CRUD Ponto', () => {

  test('Criar exige roteiro_id e endereco', async () => {
    const r1 = await api('POST', '/api/pontos', { endereco: 'X' });
    assert.equal(r1.status, 400);

    const r2 = await api('POST', '/api/pontos', { roteiro_id: 1 });
    assert.equal(r2.status, 400);
  });

  test('Excluir roteiro remove os pontos em cascata (ON DELETE CASCADE)', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);
    await criarPonto(r.id, 'A');
    await criarPonto(r.id, 'B');

    await api('DELETE', `/api/roteiros/${r.id}`);

    const lista = await api('GET', `/api/pontos/roteiro/${r.id}`);
    assert.equal(lista.status, 200);
    assert.equal(lista.body.length, 0, 'Pontos devem ter sido apagados junto com o roteiro');
  });
});

// ============================================================
// Cálculo de tempo total — valores variados (verificação cruzada)
// ============================================================
describe('Verificação cruzada — exemplo do PDF', () => {

  test('Roteiro A do PDF: 5 + 10 + 50 = 65 min (partida ignorada)', async () => {
    const m = await criarMotorista();
    const r = await criarRoteiro(m.id);

    await criarPonto(r.id, 'Seg. Família (partida)', null, null);
    await criarPonto(r.id, 'Rua Peru, 55',   '2026-09-22T08:00:00', '2026-09-22T08:05:00'); // 5
    await criarPonto(r.id, 'Rua X, 5',       '2026-09-22T08:30:00', '2026-09-22T08:40:00'); // 10
    await criarPonto(r.id, 'Av. João César', '2026-09-22T09:00:00', '2026-09-22T09:50:00'); // 50

    const det = await api('GET', `/api/roteiros/${r.id}`);
    assert.equal(det.body.tempo_total_parado_min, 65);
  });
});