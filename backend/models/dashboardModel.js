const db = require('../db/connection');
const ParametroModel = require('./parametroModel');

/**
 * RN07: custo do trajeto = (distância percorrida ÷ rendimento km/l do motorista) × preço do combustível vigente.
 */
function calcularCustoRoteiro(distanciaKm, rendimentoKmL, precoCombustivel) {
  if (!rendimentoKmL || rendimentoKmL <= 0 || !precoCombustivel) return 0;
  return Number(((distanciaKm / rendimentoKmL) * precoCombustivel).toFixed(2));
}

/**
 * RN04: jornada padrão parametrizável (default 8h/dia).
 * Horas trabalhadas = intervalo entre a primeira chegada e a última saída registradas no roteiro.
 */
function calcularJornada(horasTrabalhadas, jornadaHorasDia = 8) {
  const horasExtras = Math.max(0, horasTrabalhadas - jornadaHorasDia);
  const percentualJornada = jornadaHorasDia > 0
    ? Number(Math.min(100, (horasTrabalhadas / jornadaHorasDia) * 100).toFixed(1))
    : 0;
  return { horasTrabalhadas: Number(horasTrabalhadas.toFixed(2)), horasExtras: Number(horasExtras.toFixed(2)), percentualJornada };
}

const DashboardModel = {
  calcularCustoRoteiro,
  calcularJornada,

  // Roteiros do período, já com o tempo parado (RN01/RN03) e a janela de horário do dia
  roteirosNoPeriodo({ inicio, fim, motorista_id }) {
    return db.prepare(`
      SELECT r.id, r.data, r.distancia_total_km, r.motorista_id,
             m.nome AS motorista_nome, m.rendimento_km_l,
             COALESCE((SELECT SUM(tempo_parado_min) FROM ponto WHERE roteiro_id = r.id AND ordem > 1), 0) AS tempo_parado_min,
             (SELECT MIN(data_hora_chegada) FROM ponto WHERE roteiro_id = r.id) AS inicio_dia,
             (SELECT MAX(data_hora_saida)   FROM ponto WHERE roteiro_id = r.id) AS fim_dia
        FROM roteiro r
        JOIN motorista m ON m.id = r.motorista_id
       WHERE (? IS NULL OR r.data >= ?)
         AND (? IS NULL OR r.data <= ?)
         AND (? IS NULL OR r.motorista_id = ?)
       ORDER BY r.data
    `).all(inicio, inicio, fim, fim, motorista_id, motorista_id);
  },

  indicadores({ inicio, fim, motorista_id }) {
    const parametro = ParametroModel.vigente();
    const roteiros = this.roteirosNoPeriodo({ inicio, fim, motorista_id });

    if (!roteiros.length) return { totalRegistros: 0 };

    let tempoTotalParadoMin = 0;
    let custoTotal = 0;
    let jornadaSomaHoras = 0;
    const tempoParadoPorDia = {};
    const comparativoRoteiros = [];

    for (const r of roteiros) {
      const custo = calcularCustoRoteiro(r.distancia_total_km, r.rendimento_km_l, parametro?.preco_combustivel);
      const horasTrabalhadas = r.inicio_dia && r.fim_dia
        ? Math.max(0, (new Date(r.fim_dia) - new Date(r.inicio_dia)) / 3600000)
        : 0;
      const jornada = calcularJornada(horasTrabalhadas, parametro?.jornada_horas_dia || 8);

      tempoTotalParadoMin += r.tempo_parado_min;
      custoTotal += custo;
      jornadaSomaHoras += jornada.horasTrabalhadas;

      tempoParadoPorDia[r.data] = (tempoParadoPorDia[r.data] || 0) + r.tempo_parado_min;

      comparativoRoteiros.push({
        roteiro: `#${r.id} — ${r.motorista_nome}`,
        horasParadas: Number((r.tempo_parado_min / 60).toFixed(2))
      });
    }

    return {
      totalRegistros: roteiros.length,
      tempoTotalParadoHoras: Number((tempoTotalParadoMin / 60).toFixed(2)),
      custoTotal: Number(custoTotal.toFixed(2)),
      jornadaMediaHoras: Number((jornadaSomaHoras / roteiros.length).toFixed(2)),
      tempoParadoPorDia: Object.entries(tempoParadoPorDia).map(([data, min]) => ({
        data,
        horasParadas: Number((min / 60).toFixed(2))
      })),
      comparativoRoteiros
    };
  },

  historico({ inicio, fim, motorista_id }) {
    const parametro = ParametroModel.vigente();
    return this.roteirosNoPeriodo({ inicio, fim, motorista_id }).map((r) => {
      const custo = calcularCustoRoteiro(r.distancia_total_km, r.rendimento_km_l, parametro?.preco_combustivel);
      const horasTrabalhadas = r.inicio_dia && r.fim_dia
        ? Math.max(0, (new Date(r.fim_dia) - new Date(r.inicio_dia)) / 3600000)
        : 0;
      const jornada = calcularJornada(horasTrabalhadas, parametro?.jornada_horas_dia || 8);
      return {
        roteiro_id: r.id,
        motorista: r.motorista_nome,
        data: r.data,
        tempo_parado_horas: Number((r.tempo_parado_min / 60).toFixed(2)),
        custo,
        jornada_horas: jornada.horasTrabalhadas,
        horas_extras: jornada.horasExtras
      };
    });
  }
};

module.exports = DashboardModel;
