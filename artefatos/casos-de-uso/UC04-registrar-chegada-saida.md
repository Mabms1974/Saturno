# UC04 — Registrar Chegada/Saída em Ponto

## Identificação

| Campo        | Descrição                                                                  |
|--------------|----------------------------------------------------------------------------|
| **Código**   | UC04                                                                       |
| **Nome**     | Registrar Chegada/Saída em Ponto                                           |
| **Ator**     | Motorista / Motoboy                                                        |
| **Objetivo** | Registrar data/hora (e coordenadas) de chegada e saída em cada ponto       |
| **Prioridade** | Alta                                                                     |
| **Requisitos** | RF05                                                                     |

## Pré-condições

- Existe um **roteiro** cadastrado com pontos já definidos (UC02 e UC03).
- O motorista está acessando a aplicação no dispositivo de campo (celular/tablet).

## Pós-condições

- O ponto passa a ter `data_hora_chegada` e `data_hora_saida` registradas.
- O **tempo parado** do ponto é calculado automaticamente (RN02).
- O **tempo total parado** do roteiro é recalculado (RN03).

## Fluxo Principal

1. O ator acessa o menu **Registrar Ponto**.
2. O sistema exibe um dropdown com os roteiros disponíveis.
3. O ator seleciona o roteiro do dia.
4. O sistema exibe o resumo do roteiro e a lista de pontos em ordem sequencial.
5. O ator chega ao primeiro ponto e clica em **📍 Registrar Chegada**.
6. O sistema captura silenciosamente a localização do dispositivo (se autorizada).
7. O sistema envia `data_hora_chegada` e, se disponível, `latitude`/`longitude`.
8. O sistema exibe "Chegada registrada às ..." e desabilita o botão.
9. O ator sai do ponto e clica em **📍 Registrar Saída**.
10. O sistema captura a localização novamente.
11. O sistema envia `data_hora_saida` + coordenadas.
12. O sistema calcula o **tempo parado** do ponto aplicando as RN01 e RN02.
13. O sistema exibe "Saída registrada. Tempo parado: X min".
14. O sistema recalcula o tempo total parado do roteiro (RN03).
15. Os passos 5 a 14 se repetem para os demais pontos.

## Fluxos Alternativos

### FA01 — Ponto de partida (ordem 1)
- No passo 12, se o ponto for o de **partida** (ordem 1), o tempo parado é registrado como **0** (RN01) e o sistema informa "ponto de partida não conta tempo".

### FA02 — Permissão de geolocalização negada
- No passo 6 ou 10, se o ator negar a permissão, o sistema registra apenas a data/hora e continua normalmente.

## Fluxos de Exceção

### FE01 — Falha na captura de geolocalização
- O sistema espera no máximo 5 segundos pela resposta do navegador; se exceder, registra apenas a data/hora.

### FE02 — Falha de comunicação com o servidor
- O sistema exibe a mensagem de erro e restaura o botão para nova tentativa.

## Regras de Negócio Relacionadas

- **RN01** — Ponto de partida não conta tempo parado.
- **RN02** — Tempo parado = saída − chegada.
- **RN03** — Tempo total do roteiro = soma de todos os pontos, exceto a partida.

## Telas Relacionadas

- `frontend/registrar-ponto.html`
