# UC01 — Cadastrar Motorista / Motoboy

## Identificação

| Campo        | Descrição                                       |
|--------------|-------------------------------------------------|
| **Código**   | UC01                                            |
| **Nome**     | Cadastrar Motorista / Motoboy                   |
| **Ator**     | Gerente / Coordenador                           |
| **Objetivo** | Registrar um motorista/motoboy no sistema para que ele possa receber roteiros |
| **Prioridade** | Alta                                          |
| **Requisitos** | RF01                                          |

## Pré-condições

- O usuário deve estar autenticado com perfil de **Gerente/Coordenador**.
- O sistema deve estar disponível.

## Pós-condições

- O motorista fica persistido no banco de dados com um `id` único.
- O motorista passa a aparecer na lista de motoristas disponíveis para vincular a roteiros.

## Fluxo Principal

1. O ator acessa o menu **Motoristas**.
2. O sistema exibe o formulário de cadastro e a lista de motoristas já cadastrados.
3. O ator preenche os campos obrigatórios:
   - **Nome** (obrigatório)
   - Telefone
   - Documento (CPF/CNH)
   - Veículo
   - Rendimento (km/litro)
4. O ator clica em **Salvar motorista**.
5. O sistema valida os dados.
6. O sistema grava o motorista no banco.
7. O sistema exibe a mensagem "Motorista salvo com sucesso!".
8. O sistema recarrega a lista de motoristas exibida na tela.

## Fluxos Alternativos

### FA01 — Campo obrigatório em branco
- No passo 5, se o campo **Nome** estiver vazio, o sistema bloqueia o envio e exibe mensagem de erro.

### FA02 — Documento duplicado
- No passo 5, se o **Documento** já existir no banco, o sistema rejeita o cadastro e informa o conflito.

## Fluxos de Exceção

### FE01 — Falha de comunicação com o servidor
- Em qualquer passo de persistência, se a API retornar erro, o sistema exibe a mensagem de erro retornada e mantém os dados preenchidos para nova tentativa.

## Regras de Negócio Relacionadas

- Não há RN específica. Aplica-se validação básica de campos obrigatórios.

## Telas Relacionadas

- `frontend/cadastro-motorista.html`
