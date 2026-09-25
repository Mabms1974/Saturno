/* ============================================================
   Testes automatizados — Camada Gestora (Paulo)
   Cobre: parametrização (RN04/RN07), dashboard e histórico.
   Segue o mesmo padrão de backend/tests/mvp.test.js.
   ============================================================ */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const TEST_DB = path.join(DATA_DIR, 'test-gestao.db');
process.env.DB_PATH = TEST_DB;

for (const sufixo of ['', '-wal', '-shm']) {
  const f = TEST_DB + sufixo;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const db = require('../db/connection');
const { calcularCustoRoteiro, calcularJornada } = require('../models/dashboardModel');

let server;
let baseURL;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  db.exec('DELETE FROM ponto; DELETE FROM roteiro; DELETE FROM motorista; DELETE FROM parametro;');
});

async function api(metodo, rota, corpo) {
  const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (corpo) opcoes.body = JSON.stringify(corpo);
  const resp = await fetch(baseURL + rota, opcoes);
  const texto = await resp.text();
  const json = texto ? JSON.parse(texto) : null;
  return { status: resp.status, body: json };
}

// ------------------------------------------------------------
// RN07 — cálculo de custo (função pura)
// ------------------------------------------------------------
describe('RN07 — Custo do trajeto', () => {
  test('custo = (distância ÷ rendimento) × preço do combustível', () => {
    const custo = calcularCustoRoteiro(70, 35, 6);
    assert.equal(custo, 12); // 70/35 = 2 litros × R$6 = R$12
  });

  test('rendimento zero ou ausente retorna custo zero, sem lançar exceção', () => {
    assert.equal(calcularCustoRoteiro(70, 0, 6), 0);
    assert.equal(calcularCustoRoteiro(70, null, 6), 0);
  });
});

// ------------------------------------------------------------
// RN04 — cálculo de jornada
// ------------------------------------------------------------
describe('RN04 — Jornada de 8h/dia', () => {
  test('dentro da jornada não gera horas extras', () => {
    const j = calcularJornada(6, 8);
    assert.equal(j.horasExtras, 0);
    assert.equal(j.percentualJornada, 75);
  });

  test('acima da jornada gera horas extras', () => {
    const j = calcularJornada(10, 8);
    assert.equal(j.horasExtras, 2);
    assert.equal(j.percentualJornada, 100);
  });
});

// ------------------------------------------------------------
// UC02 — Parametrizar Custos/Jornada
// ------------------------------------------------------------
describe('UC02 — Parametrização', () => {
  test('cria o primeiro parâmetro vigente', async () => {
    const { status, body } = await api('POST', '/api/parametros', {
      preco_combustivel: 6,
      jornada_horas_dia: 8
    });
    assert.equal(status, 201);
    assert.equal(body.preco_combustivel, 6);
    assert.equal(body.vigencia_fim, null);
  });

  test('novo parâmetro fecha a vigência do anterior (histórico preservado)', async () => {
    await api('POST', '/api/parametros', { preco_combustivel: 6, jornada_horas_dia: 8 });
    await api('POST', '/api/parametros', { preco_combustivel: 6.5, jornada_horas_dia: 8 });

    const { body: vigente } = await api('GET', '/api/parametros/vigente');
    assert.equal(vigente.preco_combustivel, 6.5);

    const { body: historico } = await api('GET', '/api/parametros/historico');
    assert.equal(historico.length, 2);
    assert.notEqual(historico.find((p) => p.preco_combustivel === 6).vigencia_fim, null);
  });

  test('rejeita preco_combustivel inválido', async () => {
    const { status, body } = await api('POST', '/api/parametros', { preco_combustivel: 0, jornada_horas_dia: 8 });
    assert.equal(status, 400);
    assert.ok(body.erro);
  });
});

// ------------------------------------------------------------
// UC01 — Consultar Dashboard / UC03 — Histórico
// ------------------------------------------------------------
describe('UC01/UC03 — Dashboard e Histórico', () => {
  test('sem roteiros no período retorna totalRegistros = 0', async () => {
    const { body } = await api('GET', '/api/dashboard?inicio=2026-01-01&fim=2026-01-31');
    assert.equal(body.totalRegistros, 0);
  });

  test('agrega tempo parado, custo e jornada de um roteiro completo', async () => {
    await api('POST', '/api/parametros', { preco_combustivel: 6, jornada_horas_dia: 8 });

    const { body: motorista } = await api('POST', '/api/motoristas', {
      nome: 'João', veiculo: 'CG 160', rendimento_km_l: 35
    });
    const { body: roteiro } = await api('POST', '/api/roteiros', {
      data: '2026-09-22', motorista_id: motorista.id, distancia_total_km: 70
    });

    // Ponto 1 = partida (não conta tempo parado — RN01)
    const { body: p1 } = await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Base' });
    await api('POST', `/api/pontos/${p1.id}/chegada`, { data_hora_chegada: '2026-09-22T08:00:00' });

    // Ponto 2 = 25 min parado
    const { body: p2 } = await api('POST', '/api/pontos', { roteiro_id: roteiro.id, endereco: 'Cliente A' });
    await api('POST', `/api/pontos/${p2.id}/chegada`, { data_hora_chegada: '2026-09-22T09:00:00' });
    await api('POST', `/api/pontos/${p2.id}/saida`, { data_hora_saida: '2026-09-22T09:25:00' });

    const { body: dashboard } = await api('GET', `/api/dashboard?inicio=2026-09-22&fim=2026-09-22`);
    assert.equal(dashboard.totalRegistros, 1);
    assert.equal(dashboard.tempoTotalParadoHoras, Number((25 / 60).toFixed(2)));
    assert.equal(dashboard.custoTotal, 12); // 70km / 35km/l × R$6

    const { body: historico } = await api('GET', `/api/relatorios/historico?inicio=2026-09-22&fim=2026-09-22`);
    assert.equal(historico.length, 1);
    assert.equal(historico[0].custo, 12);
  });
});
