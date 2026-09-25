# UC05 — Consultar Dashboard

## Identificação

| Campo        | Descrição                                       |
|--------------|-------------------------------------------------|
| **Código**   | UC05                                            |
| **Nome**     | Consultar Dashboard                             |
| **Ator**     | Gerente / Coordenador                           |
| **Objetivo** | Visualizar indicadores consolidados de tempo parado, custo e jornada, agrupados por dia, mês, período e motorista |
| **Prioridade** | Alta                                          |
| **Requisitos** | RF05                                          |

## Pré-condições

- O sistema deve estar disponível.
- Deve existir ao menos um roteiro com pontos registrados para que haja indicadores a exibir.

## Pós-condições

- Os indicadores exibidos correspondem ao filtro selecionado (período/motorista).

## Fluxo Principal

1. O ator acessa o menu **Dashboard**.
2. O sistema carrega, por padrão, os indicadores do mês corrente.
3. O sistema consulta os roteiros do período, soma o tempo parado (RN01/RN03), calcula o custo (RN07) e a jornada (RN04) de cada um.
4. O sistema exibe os KPIs (tempo total parado, custo consolidado, jornada média, roteiros no período) e os gráficos (tempo parado por dia, comparativo entre roteiros).
5. O ator pode ajustar o filtro (data início/fim, motorista) e clicar em **Filtrar**.
6. O sistema recalcula e atualiza os indicadores exibidos.

## Fluxos Alternativos

### FA01 — Sem dados no período
- No passo 4, se não houver roteiros no filtro aplicado, o sistema exibe a mensagem "Nenhum registro encontrado para o período selecionado. Ajuste o filtro." em vez dos gráficos.

### FA02 — Ir para o histórico completo
- O ator clica em **Ver histórico completo**; o sistema direciona para UC07 (Gerar Histórico/Relatórios).

## Fluxos de Exceção

### FE01 — Falha na consulta
- Se a API retornar erro, o sistema exibe uma mensagem de erro e mantém o último filtro válido preenchido no formulário.

## Regras de Negócio Relacionadas

- RN01 — ponto de partida não conta tempo parado (consumida, calculada pela camada operacional).
- RN04 — jornada padrão parametrizável (default 8h/dia).
- RN07 — custo do trajeto = distância ÷ rendimento do motorista × preço do combustível vigente.

## Telas Relacionadas

- `frontend/dashboard.html`
