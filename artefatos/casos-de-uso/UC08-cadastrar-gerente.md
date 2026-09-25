# UC08 — Cadastrar Gerente/Coordenador

## Identificação

| Campo        | Descrição                                                                  |
|--------------|------------------------------------------------------------------------------|
| **Código**   | UC08                                                                       |
| **Nome**     | Cadastrar Gerente/Coordenador                                              |
| **Ator**     | Administrador / Dono do sistema                                            |
| **Objetivo** | Registrar um gerente/coordenador no sistema, para que ele possa gerenciar motoristas, roteiros e visualizar o dashboard/histórico de sua equipe |
| **Prioridade** | Alta                                                                     |
| **Requisitos** | RF02                                                                     |

## Pré-condições

- O usuário deve estar autenticado com perfil de **Administrador/Dono**.
- O sistema deve estar disponível.

## Pós-condições

- O gerente fica persistido no banco de dados com um `id` único.
- O gerente passa a poder ser associado a uma equipe (motoristas/roteiros) e a acessar as
  funcionalidades de gestão (UC02, UC03, UC05, UC06, UC07).

## Fluxo Principal

1. O ator acessa o menu **Gerentes**.
2. O sistema exibe o formulário de cadastro e a lista de gerentes já cadastrados.
3. O ator preenche os campos obrigatórios:
   - **Nome** (obrigatório)
   - **E-mail** (obrigatório)
   - Telefone
   - Equipe sob responsabilidade
4. O ator clica em **Salvar gerente**.
5. O sistema valida os dados.
6. O sistema grava o gerente no banco.
7. O sistema exibe a mensagem "Gerente salvo com sucesso!".
8. O sistema recarrega a lista de gerentes exibida na tela.

## Fluxos Alternativos

### FA01 — Campo obrigatório em branco
- No passo 5, se o campo **Nome** ou **E-mail** estiverem vazios, o sistema bloqueia o
  envio e exibe mensagem de erro.

### FA02 — E-mail duplicado
- No passo 5, se o **E-mail** já existir no banco, o sistema rejeita o cadastro e informa
  o conflito.

### FA03 — E-mail em formato inválido
- No passo 5, se o **E-mail** informado não corresponder a um formato válido, o sistema
  bloqueia o envio e exibe mensagem de erro.

## Fluxos de Exceção

### FE01 — Falha de comunicação com o servidor
- Em qualquer passo de persistência, se a API retornar erro, o sistema exibe a mensagem de
  erro retornada e mantém os dados preenchidos para nova tentativa.

## Regras de Negócio Relacionadas

- Não há RN específica. Aplica-se validação básica de campos obrigatórios e de formato de
  e-mail.

## Telas Relacionadas

- `frontend/cadastro-gerente.html`
