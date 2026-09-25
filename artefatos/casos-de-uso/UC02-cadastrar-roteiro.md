# UC02 — Cadastrar Roteiro

## Identificação

| Campo        | Descrição                                                         |
|--------------|-------------------------------------------------------------------|
| **Código**   | UC02                                                              |
| **Nome**     | Cadastrar Roteiro                                                 |
| **Ator**     | Gerente / Coordenador                                             |
| **Objetivo** | Montar o roteiro diário de um motorista, associando-o a uma data  |
| **Prioridade** | Alta                                                            |
| **Requisitos** | RF04 (parcial), RN05                                            |

## Pré-condições

- Existe ao menos um **motorista** cadastrado no sistema (UC01).
- O usuário está autenticado como **Gerente/Coordenador**.

## Pós-condições

- O roteiro é criado com um `id` único e vinculado ao motorista e à data escolhidos.
- O roteiro passa a aparecer na lista de roteiros cadastrados.

## Fluxo Principal

1. O ator acessa o menu **Roteiros**.
2. O sistema exibe o formulário com:
   - Data do roteiro
   - Seleção de motorista (dropdown populado via API)
   - Distância total (km) — opcional
3. O sistema pré-preenche o campo **Data** com a data corrente.
4. O ator ajusta a data, escolhe o motorista responsável e informa a distância.
5. O ator clica em **Criar roteiro**.
6. O sistema valida os dados.
7. O sistema grava o roteiro no banco aplicando a **RN05** (um motorista + uma data por roteiro).
8. O sistema exibe a mensagem "Roteiro criado com sucesso!".
9. A lista de roteiros é recarregada.

## Fluxos Alternativos

### FA01 — Nenhum motorista selecionado
- No passo 6, se o motorista não estiver selecionado, o sistema bloqueia o envio.

### FA02 — Data ou motorista ausentes
- Se algum dos campos obrigatórios (`data` ou `motorista_id`) não for informado, o backend rejeita com status 400.

## Fluxos de Exceção

### FE01 — Falha de comunicação com o servidor
- O sistema exibe a mensagem de erro e mantém o formulário preenchido.

## Regras de Negócio Relacionadas

- **RN05** — Cada roteiro pertence a um único motorista e a uma única data.

## Telas Relacionadas

- `frontend/cadastro-roteiro.html`
