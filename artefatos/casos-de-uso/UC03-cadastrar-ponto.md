# UC03 — Cadastrar Ponto no Roteiro

## Identificação

| Campo        | Descrição                                                              |
|--------------|------------------------------------------------------------------------|
| **Código**   | UC03                                                                   |
| **Nome**     | Cadastrar Ponto no Roteiro                                             |
| **Ator**     | Gerente / Coordenador                                                  |
| **Objetivo** | Adicionar um ponto (endereço + coordenadas) a um roteiro existente     |
| **Prioridade** | Alta                                                                 |
| **Requisitos** | RF03, RN06                                                           |

## Pré-condições

- Existe ao menos um **roteiro** cadastrado (UC02).
- O usuário está autenticado como **Gerente/Coordenador**.

## Pós-condições

- O ponto é persistido com uma **ordem sequencial** definida automaticamente (RN06).
- Se o ponto for o primeiro do roteiro (ordem 1), ele é marcado como **ponto de partida**.

## Fluxo Principal

1. O ator acessa o menu **Pontos**.
2. O sistema exibe o formulário com:
   - Seleção de roteiro (dropdown populado via API)
   - Endereço
   - Latitude / Longitude
   - Botão **📍 Usar minha localização**
3. O ator seleciona o roteiro.
4. O ator informa o endereço manualmente **ou** clica em **📍 Usar minha localização**.
5. Se o ator clicar em "Usar minha localização":
   1. O sistema solicita permissão de geolocalização ao navegador.
   2. O sistema obtém as coordenadas e as exibe nos campos.
   3. O sistema consulta o serviço Nominatim (OpenStreetMap) para **geocodificação reversa**.
   4. O sistema preenche o campo **Endereço** com o resultado.
6. O ator revisa/ajusta os dados e clica em **Adicionar ponto**.
7. O sistema valida os campos obrigatórios.
8. O sistema calcula a **ordem** do ponto (último + 1) aplicando a **RN06**.
9. O sistema persiste o ponto no banco.
10. O sistema exibe a mensagem "Ponto adicionado!".
11. A lista de pontos do roteiro é atualizada.

## Fluxos Alternativos

### FA01 — Permissão de geolocalização negada
- No passo 5.1, se o ator negar a permissão, o sistema mantém os campos para preenchimento manual e continua o fluxo.

### FA02 — Endereço não encontrado pelo serviço de geocodificação
- No passo 5.3, se o Nominatim não retornar um endereço, o sistema mantém apenas as coordenadas e permite o preenchimento manual do endereço.

### FA03 — Editar um ponto existente
- A partir da lista de pontos filtrada por roteiro, o ator pode clicar em **Editar** para abrir um modal e corrigir endereço/coordenadas.

## Fluxos de Exceção

### FE01 — Roteiro não selecionado
- No passo 7, se o roteiro não estiver selecionado, o sistema bloqueia o envio e exibe mensagem.

### FE02 — Falha de comunicação com o servidor
- O sistema exibe a mensagem de erro e mantém o formulário preenchido.

## Regras de Negócio Relacionadas

- **RN01** — O ponto de partida (ordem 1) não conta tempo parado.
- **RN06** — Os pontos de um roteiro possuem ordem sequencial automática.

## Telas Relacionadas

- `frontend/cadastro-ponto.html`
