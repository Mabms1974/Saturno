# UC06 — Parametrizar Custos/Jornada

## Identificação

| Campo        | Descrição                                       |
|--------------|-------------------------------------------------|
| **Código**   | UC06                                            |
| **Nome**     | Parametrizar Custos/Jornada                     |
| **Ator**     | Gerente / Coordenador                           |
| **Objetivo** | Definir o preço do combustível e a jornada diária padrão usados nos cálculos de custo (RN07) e jornada (RN04) |
| **Prioridade** | Alta                                          |
| **Requisitos** | RF06                                          |

## Pré-condições

- O sistema deve estar disponível.

## Pós-condições

- Um novo parâmetro vigente é persistido, com data de vigência de início.
- O parâmetro vigente anterior (se existir) é preservado no histórico, com sua vigência fim preenchida.

## Fluxo Principal

1. O ator acessa o menu **Parâmetros**.
2. O sistema exibe os valores atualmente vigentes (preço do combustível e jornada em horas/dia).
3. O ator altera um ou ambos os valores.
4. O ator clica em **Salvar parâmetros**.
5. O sistema valida os valores (numéricos e maiores que zero).
6. O sistema fecha a vigência do parâmetro anterior e grava o novo parâmetro vigente.
7. O sistema exibe a mensagem "Parâmetros atualizados." e atualiza a tabela de histórico de vigências.

## Fluxos Alternativos

- Não há fluxos alternativos além do principal para este MVP (não há parametrização por veículo individual).

## Fluxos de Exceção

### FE01 — Valor inválido
- No passo 5, se **preço do combustível** ou **jornada** forem menores ou iguais a zero, o sistema rejeita o envio e sinaliza o erro.

### FE02 — Falha de comunicação com o servidor
- Em qualquer passo de persistência, se a API retornar erro, o sistema exibe a mensagem de erro e mantém os dados preenchidos para nova tentativa.

## Regras de Negócio Relacionadas

- RN04 — jornada padrão de referência (default 8h/dia).
- RN07 — preço do combustível usado no cálculo de custo do trajeto.

## Telas Relacionadas

- `frontend/parametros.html`
