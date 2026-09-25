/* ============================================================
   Teste completo do Saturno — roda o backend inteiro de ponta a ponta
   e verifica se cada parte está funcionando.

   Cobre:
     0) Arquivos essenciais existem
     1) Motoristas (CRUD + validações + documento duplicado)
     2) Roteiros (CRUD + validações)
     3) Pontos (criação, ordem automática, chegada/saída)
     4) Regras de negócio do tempo parado (RN01, RN02, RN03, RN06)
     5) Parâmetros (RN04/RN07 — combustível e jornada, com vigência)
     6) Dashboard (indicadores agregados)
     7) Relatórios (histórico e exportação CSV)
     8) Rotas inexistentes / corpo inválido devem responder em JSON

   Roda em banco separado (data/test-full.db) — não mexe no banco real.

   Como rodar:
     cd backend
     node --test tests/full.test.js
   ============================================================ */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const TEST_DB = path.join(DATA_DIR, 'test-full.db');
process.env.DB_PATH = TEST_DB;

for (const sufixo of ['', '-wal', '-shm']) {
  const f = TEST_DB + sufixo;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ------------------------------------------------------------
// 0) Confere se os arquivos essenciais existem antes de tentar
//    carregar o app — assim, se faltar algo, o erro é claro.
// ------------------------------------------------------------
describe('0) Estrutura do projeto', () => {
  const raiz = path.join(__dirname, '..');
  const essenciais = [
    'server.js',
    'db/connection.js',
    'db/schema.sql',
    'routes/motoristaRoutes.js',
    'routes/roteiroRoutes.js',
    'routes/pontoRoutes.js',
    'routes/dashboardRoutes.js',
    'routes/parametroRoutes.js',
    'routes/relatorioRoutes.js',
    'controllers/motoristaController.js',
    'controllers/roteiroController.js',
    'controllers/pontoController.js',
    'controllers/dashboardController.js',
    'controllers/parametroController.js',
    'controllers/relatorioController.js',
    'models/motoristaModel.js',
    'models/roteiroModel.js',
    'models/pontoModel.js',
    'models/dashboardModel.js',
    'models/parametroModel.js'
  ];

  for (const rel of essenciais) {
    test(`existe backend/${rel}`, () => {
      assert.ok(fs.existsSync(path.join(raiz, rel)), `Arquivo faltando: ${rel}`);
    });
  }
});

const app = require('../server');
const db = require('../db/connection');

// ------------------------------------------------------------
// Infra dos testes
// ------------------------------------------------------------
let server;
let baseURL;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  for (const sufixo of ['', '-wal', '-shm']) {
    const f = TEST_DB + sufixo;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

beforeEach(() => {
  db.exec(`
    DELETE FROM ponto;
    DELETE FROM roteiro;
    DELETE FROM motorista;
    DELETE FROM parametro;
  `);
});

// Helper genérico para chamar a API e sempre receber { status, body }
async function api(metodo, rota, corpo) {
  const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);
  const resp = await fetch(baseURL + rota, opcoes);
  const texto = await resp.text();
  let json = null;
  let eraJson = true;
  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      eraJson = false;
    }
  }
  return { status: resp.status, body: json, texto, eraJson, headers: resp.headers };
}

// Cria um motorista pronto para usar nos testes de roteiro/ponto/dashboard
async function criarMotorista(overrides = {}) {
  const { body } = await api('POST', '/api/motoristas', {
    nome: 'Motorista Teste',
    telefone: '31999999999',
    documento: `DOC-${Math.random().toString(36).slice(2, 10)}`,
    veiculo: 'Moto Teste',
    rendimento_km_l: 20,
    ...overrides
  });
  return body;
}

// ============================================================
// 1) MOTORISTAS
// ============================================================
describe('1) Motoristas', () => {
  test('POST cria motorista válido (201)', async () => {
    const { status, body } = await api('POST', '/api/motoristas', {
      nome: 'Paulo Campos',
      telefone: '3152148913',
      documento: '12345678910',
      veiculo: 'Cg titan',
      rendimento_km_l: 15
    });
    assert.equal(status, 201);
    assert.ok(body.id);
    assert.equal(body.nome, 'Paulo Campos');
  });

  test('POST sem nome retorna 400', async () => {
    const { status, body } = await api('POST', '/api/motoristas', { telefone: '123' });
    assert.equal(status, 400);
    assert.ok(body && body.erro);
  });

  test('POST com documento duplicado retorna 400 com mensagem clara', async () => {
    await api('POST', '/api/motoristas', { nome: 'A', documento: 'DUPLICADO' });
    const { status, body } = await api('POST', '/api/motoristas', { nome: 'B', documento: 'DUPLICADO' });
    assert.equal(status, 400);
    assert.ok(body && typeof body.erro === 'string' && body.erro.length > 0);
  });

  test('GET lista motoristas cadastrados', async () => {
    await criarMotorista({ nome: 'Fulano' });
    await criarMotorista({ nome: 'Ciclano' });
    const { status, body } = await api('GET', '/api/motoristas');
    assert.equal(status, 200);
    assert.equal(body.length, 2);
  });

  test('GET /:id retorna o motorista certo', async () => {
    const m = await criarMotorista({ nome: 'Beltrano' });
    const { status, body } = await api('GET', `/api/motoristas/${m.id}`);
    assert.equal(status, 200);
    assert.equal(body.nome, 'Beltrano');
  });

  test('GET /:id inexistente retorna 404', async () => {
    const { status } = await api('GET', '/api/motoristas/999999');
    assert.equal(status, 404);
  });

  test('PUT atualiza motorista', async () => {
    const m = await criarMotorista({ nome: 'Antes' });
    const { status, body } = await api('PUT', `/api/motoristas/${m.id}`, { nome: 'Depois' });
    assert.equal(status, 200);
    assert.equal(body.nome, 'Depois');
  });

  test('DELETE remove motorista (204)', async () => {
    const m = await criarMotorista();
    const { status } = await api('DELETE', `/api/motoristas/${m.id}`);
    assert.equal(status, 204);
    const consulta = await api('GET', `/api/motoristas/${m.id}`);
    assert.equal(consulta.status, 404);
  });
});

// ============================================================
// 2) ROTEIROS
// ============================================================
describe('2) Roteiros', () => {
  test('POST cria roteiro válido (201)', async () => {
    const m = await criarMotorista();
    const { status, body } = await api('POST', '/api/roteiros', {
      data: '2026-01-10',
      motorista_id: m.id,
      distancia_total_km: 100
    });
    assert.equal(status, 201);
    assert.ok(body.id);
    assert.equal(body.motorista_nome, m.nome);
  });

  test('POST sem data ou motorista_id retorna 400', async () => {
    const { status } = await api('POST', '/api/roteiros', { distancia_total_km: 10 });
    assert.equal(status, 400);
  });

  test('POST com motorista_id inexistente falha (FK)', async () => {
    const { status, body } = await api('POST', '/api/roteiros', {
      data: '2026-01-10',
      motorista_id: 999999
    });
    assert.equal(status, 400);
    assert.ok(body && body.erro);
  });

  test('GET lista roteiros', async () => {
    const m = await criarMotorista();
    await api('POST', '/api/roteiros', { data: '2026-01-10', motorista_id: m.id });
    const { status, body } = await api('GET', '/api/roteiros');
    assert.equal(status, 200);
    assert.equal(body.length, 1);
  });

  test('GET /:id inexistente retorna 404', async () => {
    const { status } = await api('GET', '/api/roteiros/999999');
    assert.equal(status, 404);
  });

  test('PUT atualiza roteiro', async () => {
    const m = await criarMotorista();
    const criado = (await api('POST', '/api/roteiros', { data: '2026-01-10', motorista_id: m.id })).body;
    const { status, body } = await api('PUT', `/api/roteiros/${criado.id}`, { distancia_total_km: 250 });
    assert.equal(status, 200);
    assert.equal(body.distancia_total_km, 250);
  });

  test('DELETE remove roteiro (204)', async () => {
    const m = await criarMotorista();
    const criado = (await api('POST', '/api/roteiros', { data: '2026-01-10', motorista_id: m.id })).body;
    const { status } = await api('DELETE', `/api/roteiros/${criado.id}`);
    assert.equal(status, 204);
  });
});

// ============================================================
// 3) PONTOS + REGRAS DE NEGÓCIO (RN01, RN02, RN03, RN06)
// ============================================================
describe('3) Pontos e cálculo de tempo parado', () => {
  async function criarRoteiro(distancia = 65) {
    const m = await criarMotorista({ rendimento_km_l: 10 });
    const r = (await api('POST', '/api/roteiros', {
      data: '2026-01-10', motorista_id: m.id, distancia_total_km: distancia
    })).body;
    return { motorista: m, roteiro: r };
  }

  test('POST sem roteiro_id ou endereco retorna 400', async () => {
    const { status } = await api('POST', '/api/pontos', { endereco: 'Rua X' });
    assert.equal(status, 400);
  });

  test('RN06: ordem é atribuída automaticamente em sequência', async () => {
    const { roteiro } = await criarRoteiro();
    const p1 = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Ponto 1' })).body;
    const p2 = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Ponto 2' })).body;
    const p3 = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Ponto 3' })).body;
    assert.deepEqual([p1.ordem, p2.ordem, p3.ordem], [1, 2, 3]);
  });

  test('RN01: ponto de partida (ordem 1) nunca conta tempo parado', async () => {
    const { roteiro } = await criarRoteiro();
    const partida = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Partida' })).body;

    await api('POST', `/api/pontos/${partida.id}/chegada`, { data_hora_chegada: '2026-01-10T08:00:00Z' });
    const saida = await api('POST', `/api/pontos/${partida.id}/saida`, { data_hora_saida: '2026-01-10T09:00:00Z' });

    assert.equal(saida.status, 200);
    assert.equal(saida.body.tempo_parado_min, 0);
  });

  test('RN02: tempo parado = saída − chegada, em minutos', async () => {
    const { roteiro } = await criarRoteiro();
    await api('POST', `/api/pontos/${(await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Partida' })).body.id}/chegada`, {});
    const p2 = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Entrega 1' })).body;

    await api('POST', `/api/pontos/${p2.id}/chegada`, { data_hora_chegada: '2026-01-10T10:00:00Z' });
    const saida = await api('POST', `/api/pontos/${p2.id}/saida`, { data_hora_saida: '2026-01-10T10:10:00Z' });

    assert.equal(saida.status, 200);
    assert.equal(saida.body.tempo_parado_min, 10);
  });

  test('RN03: tempo total parado do roteiro soma todos os pontos, exceto a partida', async () => {
    // Reproduz o exemplo do PDF: 5 + 10 + 50 = 65 min (partida ignorada)
    const { roteiro } = await criarRoteiro();

    const partida = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Partida' })).body;
    await api('POST', `/api/pontos/${partida.id}/chegada`, { data_hora_chegada: '2026-01-10T08:00:00Z' });
    await api('POST', `/api/pontos/${partida.id}/saida`, { data_hora_saida: '2026-01-10T09:00:00Z' });

    const tempos = [5, 10, 50];
    let horaAtual = new Date('2026-01-10T10:00:00Z').getTime();
    for (const minutos of tempos) {
      const ponto = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Entrega' })).body;
      const chegada = new Date(horaAtual).toISOString();
      const saida = new Date(horaAtual + minutos * 60000).toISOString();
      await api('POST', `/api/pontos/${ponto.id}/chegada`, { data_hora_chegada: chegada });
      await api('POST', `/api/pontos/${ponto.id}/saida`, { data_hora_saida: saida });
      horaAtual += (minutos + 30) * 60000;
    }

    const { body } = await api('GET', `/api/roteiros/${roteiro.id}`);
    assert.equal(body.tempo_total_parado_min, 65);
  });

  test('registrar saída com data anterior à chegada não gera tempo negativo', async () => {
    const { roteiro } = await criarRoteiro();
    const ponto = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Entrega' })).body;
    await api('POST', `/api/pontos/${ponto.id}/chegada`, { data_hora_chegada: '2026-01-10T10:00:00Z' });
    const saida = await api('POST', `/api/pontos/${ponto.id}/saida`, { data_hora_saida: '2026-01-10T09:00:00Z' });
    assert.equal(saida.body.tempo_parado_min, 0);
  });

  test('chegada/saída em ponto inexistente retorna 404', async () => {
    const { status } = await api('POST', '/api/pontos/999999/chegada', { data_hora_chegada: '2026-01-10T08:00:00Z' });
    assert.equal(status, 404);
  });

  test('GET pontos por roteiro retorna na ordem certa', async () => {
    const { roteiro } = await criarRoteiro();
    await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'A' });
    await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'B' });
    const { body } = await api('GET', `/api/pontos/roteiro/${roteiro.id}`);
    assert.equal(body.length, 2);
    assert.ok(body[0].ordem < body[1].ordem);
  });

  test('DELETE remove ponto (204)', async () => {
    const { roteiro } = await criarRoteiro();
    const ponto = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'A' })).body;
    const { status } = await api('DELETE', `/api/pontos/${ponto.id}`);
    assert.equal(status, 204);
  });
});

// ============================================================
// 4) PARÂMETROS (combustível / jornada — RN04, RN07)
// ============================================================
describe('4) Parâmetros', () => {
  test('GET vigente sem nenhum parâmetro cadastrado retorna valores padrão', async () => {
    const { status, body } = await api('GET', '/api/parametros/vigente');
    assert.equal(status, 200);
    assert.equal(body.preco_combustivel, null);
    assert.equal(body.jornada_horas_dia, 8);
  });

  test('POST com preco_combustivel <= 0 retorna 400', async () => {
    const { status } = await api('POST', '/api/parametros', { preco_combustivel: 0, jornada_horas_dia: 8 });
    assert.equal(status, 400);
  });

  test('POST cria parâmetro e ele passa a ser o vigente', async () => {
    const { status, body } = await api('POST', '/api/parametros', {
      preco_combustivel: 5.89,
      jornada_horas_dia: 8
    });
    assert.equal(status, 201);

    const vigente = await api('GET', '/api/parametros/vigente');
    assert.equal(vigente.body.id, body.id);
    assert.equal(vigente.body.preco_combustivel, 5.89);
  });

  test('novo parâmetro fecha a vigência do anterior (histórico preservado)', async () => {
    await api('POST', '/api/parametros', { preco_combustivel: 5.0, jornada_horas_dia: 8 });
    await api('POST', '/api/parametros', { preco_combustivel: 6.0, jornada_horas_dia: 8 });

    const { body } = await api('GET', '/api/parametros/historico');
    assert.equal(body.length, 2);
    // o mais antigo deve ter vigencia_fim preenchida
    const antigo = body.find((p) => p.preco_combustivel === 5.0);
    assert.ok(antigo.vigencia_fim, 'parâmetro antigo deveria ter vigência encerrada');
  });
});

// ============================================================
// 5) DASHBOARD e RELATÓRIOS (RN04/RN07 aplicadas em conjunto)
// ============================================================
describe('5) Dashboard e relatórios', () => {
  async function cenarioCompleto() {
    await api('POST', '/api/parametros', { preco_combustivel: 5.0, jornada_horas_dia: 8 });
    const m = await criarMotorista({ rendimento_km_l: 10 });
    const roteiro = (await api('POST', '/api/roteiros', {
      data: '2026-01-10', motorista_id: m.id, distancia_total_km: 100
    })).body;

    const partida = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Partida' })).body;
    await api('POST', `/api/pontos/${partida.id}/chegada`, { data_hora_chegada: '2026-01-10T08:00:00Z' });
    await api('POST', `/api/pontos/${partida.id}/saida`, { data_hora_saida: '2026-01-10T08:00:00Z' });

    const entrega = (await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Entrega' })).body;
    await api('POST', `/api/pontos/${entrega.id}/chegada`, { data_hora_chegada: '2026-01-10T09:00:00Z' });
    await api('POST', `/api/pontos/${entrega.id}/saida`, { data_hora_saida: '2026-01-10T17:00:00Z' });

    return { motorista: m, roteiro };
  }

  test('sem roteiros no período, indicadores retorna totalRegistros = 0', async () => {
    const { status, body } = await api('GET', '/api/dashboard');
    assert.equal(status, 200);
    assert.equal(body.totalRegistros, 0);
  });

  test('indicadores calcula custo pela RN07 (distância ÷ km/l × preço combustível)', async () => {
    await cenarioCompleto();
    const { status, body } = await api('GET', '/api/dashboard');
    assert.equal(status, 200);
    assert.equal(body.totalRegistros, 1);
    // 100km / 10km/l * R$5,00 = R$50,00
    assert.equal(body.custoTotal, 50);
  });

  test('filtro por motorista_id no dashboard funciona', async () => {
    const { motorista } = await cenarioCompleto();
    const outro = await criarMotorista({ nome: 'Outro' });

    const comFiltro = await api('GET', `/api/dashboard?motorista_id=${motorista.id}`);
    assert.equal(comFiltro.body.totalRegistros, 1);

    const semRoteiro = await api('GET', `/api/dashboard?motorista_id=${outro.id}`);
    assert.equal(semRoteiro.body.totalRegistros, 0);
  });

  test('relatório histórico traz uma linha por roteiro', async () => {
    await cenarioCompleto();
    const { status, body } = await api('GET', '/api/relatorios/historico');
    assert.equal(status, 200);
    assert.equal(body.length, 1);
    assert.ok('custo' in body[0] && 'tempo_parado_horas' in body[0]);
  });

  test('exportação CSV retorna texto com cabeçalho correto', async () => {
    await cenarioCompleto();
    const { status, texto, headers } = await api('GET', '/api/relatorios/exportar');
    assert.equal(status, 200);
    assert.match(headers.get('content-type') || '', /text\/csv/);
    assert.match(texto, /^roteiro_id,motorista,data,tempo_parado_horas,custo,jornada_horas,horas_extras/);
  });
});

// ============================================================
// 6) Robustez geral da API
// ============================================================
describe('6) Robustez da API', () => {
  test('rota /api inexistente responde 404 em JSON (nunca HTML)', async () => {
    const { status, eraJson, body } = await api('GET', '/api/rota-que-nao-existe');
    assert.equal(status, 404);
    assert.ok(eraJson, 'a resposta deveria ser JSON, não HTML');
    assert.ok(body && body.erro);
  });

  test('JSON malformado no corpo retorna 400 tratado (não derruba o servidor)', async () => {
    const resp = await fetch(baseURL + '/api/motoristas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ isso não é json'
    });
    assert.equal(resp.status, 400);
  });

  test('servidor continua no ar após uma requisição inválida', async () => {
    const { status } = await api('GET', '/api/motoristas');
    assert.equal(status, 200);
  });
});
