# UC07 — Gerar Histórico/Relatórios

## Identificação

| Campo        | Descrição                                       |
|--------------|-------------------------------------------------|
| **Código**   | UC07                                            |
| **Nome**     | Gerar Histórico/Relatórios                      |
| **Ator**     | Gerente / Coordenador                           |
| **Objetivo** | Consultar o histórico de roteiros executados, com tempo parado, custo e jornada apurados, e exportar em CSV |
| **Prioridade** | Média                                         |
| **Requisitos** | RF07                                          |

## Pré-condições

- O sistema deve estar disponível.
- Devem existir roteiros cadastrados com pontos registrados.

## Pós-condições

- A tabela de histórico exibe os roteiros do filtro aplicado.
- Quando solicitada, a exportação gera um arquivo CSV com os dados filtrados.

## Fluxo Principal

1. O ator acessa o menu **Histórico**.
2. O sistema lista os roteiros em ordem cronológica, com motorista, data, tempo parado, custo, jornada e horas extras.
3. O ator aplica filtros (data início/fim, motorista) e clica em **Filtrar**.
4. O sistema recalcula e exibe a lista filtrada.
5. O ator clica em **Exportar CSV**.
6. O sistema gera o arquivo CSV com os dados filtrados e o navegador inicia o download.

## Fluxos Alternativos

### FA01 — Sem roteiros no filtro
- No passo 4, se não houver roteiros no período/motorista filtrado, o sistema exibe "Nenhum roteiro encontrado para o filtro atual." em vez da tabela.

## Fluxos de Exceção

### FE01 — Falha na consulta
- Se a API retornar erro ao carregar o histórico, o sistema exibe mensagem de erro e mantém a última lista válida na tela.

## Regras de Negócio Relacionadas

- RN01/RN03 — tempo parado por roteiro (consumido, calculado pela camada operacional).
- RN04 — jornada e horas extras por roteiro.
- RN06 — ordenação sequencial dos pontos (consumida, não recalculada aqui).
- RN07 — custo do trajeto.

## Telas Relacionadas

- `frontend/historico.html`
