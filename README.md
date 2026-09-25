# 🪐 Saturno — Logística Inteligente

> Sistema de monitoramento de **tempo parado em roteiros de entrega**.
> MVP desenvolvido para a disciplina de **Engenharia de Software II** — PUC Minas.
> Prof. Sandro Laudares · 2026

<p align="center">
  <img src="frontend/img/logo.png" alt="Saturno" width="240">
</p>

<p align="center">
  <a href="https://github.com/Mabms1974/Saturno">
    <img src="https://img.shields.io/badge/GitHub-Saturno-1a2e4a?logo=github" alt="Repositório">
  </a>
  <img src="https://img.shields.io/badge/status-MVP%20completo-10b981" alt="Status">
  <img src="https://img.shields.io/badge/testes-86%2F86%20passando-10b981" alt="Testes">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js" alt="Node">
</p>

---

## 📌 Sobre o projeto

Empresas de logística e entrega urbana precisam saber **onde e por quanto tempo** seus profissionais de campo ficam parados durante o roteiro diário. Hoje esse tempo é invisível: não há registro confiável de quanto tempo o entregador, motorista ou transportador permanece em cada ponto do trajeto.

O **Saturno** resolve esse problema ao:

- Registrar os pontos do roteiro, com data/hora de chegada e saída
- Capturar **geolocalização** do dispositivo de campo automaticamente
- Calcular automaticamente o **tempo parado** em cada ponto (exceto o ponto de partida)
- Consolidar o **tempo total parado por roteiro**
- Fornecer base de dados para o **dashboard analítico** (por dia, mês e período)
- Permitir **parametrização de custos** (combustível, km/litro, custo por km)

---

## 🎯 Escopo do MVP

### Dentro do escopo

- ✅ Cadastro de motoristas/motoboys, pontos e roteiros
- ✅ Coleta de chegada/saída em cada ponto (data/hora + coordenadas)
- ✅ Geocodificação reversa (endereço automático via OpenStreetMap)
- ✅ Cálculo de tempo parado por ponto e total do roteiro
- ✅ Histórico de pontos e tempos por período
- ✅ Parametrização de custos e jornada padrão (8 h/dia)
- ✅ Dashboard com gráficos por dia, mês e período (camada do gestor)

### Fora do escopo

- ❌ Roteirização automática / otimização de rotas
- ❌ Integração com ERP ou folha de pagamento
- ❌ Rastreamento em tempo real via telemetria embarcada
- ❌ Aplicativo nativo publicado em lojas

---

## 🧠 Regras de Negócio implementadas

| ID   | Regra                                                                                          | Status |
|------|------------------------------------------------------------------------------------------------|:------:|
| RN01 | O **ponto de partida** (ordem 1) **não conta** tempo parado                                     | ✅     |
| RN02 | Tempo parado = horário de **saída − chegada** do ponto                                         | ✅     |
| RN03 | Tempo total do roteiro = **soma dos tempos** de todos os pontos, exceto o de partida           | ✅     |
| RN04 | Jornada padrão **parametrizável** (default 8 h/dia), usada para calcular horas extras          | ✅     |
| RN05 | Cada roteiro pertence a **um único motorista** e a **uma única data**                          | ✅     |
| RN06 | Os pontos têm **ordem sequencial** (1, 2, 3…) que define o trajeto do dia                     | ✅     |
| RN07 | Custo do trajeto = (distância ÷ km/litro do veículo) × preço do combustível vigente             | ✅     |

---

## 🧱 Stack tecnológica

| Camada       | Tecnologia                                          |
|--------------|-----------------------------------------------------|
| Backend      | Node.js + Express                                   |
| Banco        | SQLite (`better-sqlite3`) — arquivo local           |
| Frontend     | HTML5 + CSS3 + JavaScript puro (Fetch API)          |
| Geocoding    | Nominatim (OpenStreetMap) — gratuito, sem chave     |
| Geolocation  | `navigator.geolocation` (API nativa do navegador)   |
| Testes       | `node:test` (nativo do Node 20+) + `fetch` nativo   |
| Design       | Design System próprio (azul-marinho + dourado)      |

> Não há build, bundler ou framework pesado. O projeto sobe direto com `npm run dev`.

---

## ✨ Funcionalidades implementadas

### Operação de campo (Marco)

- 👤 **Cadastro de motoristas** — nome, telefone, documento, veículo, km/l
- 🗺️ **Cadastro de roteiros** — data, motorista, distância
- 📍 **Cadastro de pontos** — endereço + coordenadas (com botão "usar minha localização")
- ✏️ **Edição de ponto** — modal para corrigir endereço/coordenadas
- ⏱️ **Registro de chegada/saída** — captura automática de data/hora + geolocalização
- 🧮 **Cálculo automático** de tempo parado (RN01/RN02/RN03)
- 🎯 **Ordem sequencial automática** dos pontos (RN06)

### Camada do gestor (Paulo)

- 📊 **Dashboard** com KPIs (tempo total parado, custo consolidado, jornada média, roteiros no período) e gráficos de barra (tempo parado por dia e comparativo entre roteiros), em CSS puro, sem dependência externa
- 🔎 **Filtros** por período (De/Até) e por motorista, tanto no dashboard quanto no histórico
- 💰 **Parametrização de custos e jornada** — preço do combustível (R$/litro) e jornada padrão (h/dia), com **histórico de vigências**: ao salvar um novo valor, o anterior é preservado com data de início/fim
- 📈 **Histórico de rotas** — tabela com tempo parado, custo, jornada e horas extras por roteiro
- 📤 **Exportação de relatórios em CSV**, respeitando os mesmos filtros aplicados na tela

---

## 📁 Estrutura de pastas

```
TP2_ES2/
├── backend/
│   ├── package.json
│   ├── server.js                 # Sobe o Express, monta rotas e serve o frontend
│   ├── data/                     # Banco SQLite (gerado em tempo de execução)
│   │   └── tempo_parado.db
│   ├── db/
│   │   ├── connection.js         # Abertura do banco + aplicação do schema
│   │   └── schema.sql            # CREATE TABLE motorista, roteiro, ponto
│   ├── models/
│   │   ├── motoristaModel.js
│   │   ├── roteiroModel.js
│   │   ├── pontoModel.js         # ⚙️ Cálculo das RN01/RN02/RN03 + geoloc
│   │   ├── parametroModel.js     # ⚙️ RN04/RN07 — vigência de combustível/jornada
│   │   └── dashboardModel.js     # ⚙️ Agregações do dashboard/histórico
│   ├── controllers/
│   │   ├── motoristaController.js
│   │   ├── roteiroController.js
│   │   ├── pontoController.js
│   │   ├── parametroController.js
│   │   ├── dashboardController.js
│   │   └── relatorioController.js
│   ├── routes/
│   │   ├── motoristaRoutes.js
│   │   ├── roteiroRoutes.js
│   │   ├── pontoRoutes.js
│   │   ├── parametroRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── relatorioRoutes.js
│   └── tests/
│       ├── mvp.test.js           # RN01/RN02/RN03/RN06 + CRUD operacional
│       ├── gestao.test.js        # RN04/RN07 + parâmetros/dashboard
│       └── full.test.js          # Suíte de ponta a ponta (todas as rotas)
│
├── frontend/
│   ├── index.html
│   ├── cadastro-motorista.html
│   ├── cadastro-roteiro.html
│   ├── cadastro-ponto.html
│   ├── registrar-ponto.html
│   ├── dashboard.html
│   ├── parametros.html
│   ├── historico.html
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   ├── img/
│   │   └── logo.png
│   └── js/
│       ├── api.js
│       ├── motorista.js
│       ├── roteiro.js
│       ├── ponto.js              # Geolocalização + modal de edição
│       ├── registrar-ponto.js    # Captura de coords na chegada/saída
│       ├── dashboard.js          # KPIs + gráficos de barra em CSS puro
│       ├── parametros.js         # Form de custos/jornada + histórico
│       └── historico.js          # Tabela filtrável + exportação CSV
│
├── artefatos/                    # Projeto Preliminar (documentação)
│   ├── casos-de-uso/
│   │   ├── UC01-cadastrar-motorista.md
│   │   ├── UC02-cadastrar-roteiro.md
│   │   ├── UC03-cadastrar-ponto.md
│   │   ├── UC04-registrar-chegada-saida.md
│   │   ├── UC05-consultar-dashboard.md
│   │   ├── UC06-parametrizar-custos-jornada.md
│   │   └── UC07-gerar-historico-relatorios.md
│   ├── diagramas-robustez/
│   │   ├── diagramas-robustez-operacional.md   # UC01-UC04 (Marco)
│   │   └── diagramas-robustez-gestor.md        # UC05-UC07 (Paulo)
│   ├── diagrama-classes/
│   │   ├── diagrama-classes-operacional.md     # Motorista, Roteiro, Ponto (Marco)
│   │   └── diagrama-classes-gestao.md          # + Parametro (Paulo)
│   └── imagens/
│
└── README.md
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- **Node.js 20 ou superior** — [baixar aqui](https://nodejs.org)
- **npm** (já vem com o Node)
- Terminal (PowerShell no Windows, Terminal no macOS/Linux)

Confirme a versão:

```bash
node -v      # deve mostrar v20.x ou superior
npm -v
```

### 1. Clonar o repositório

```bash
git clone https://github.com/Mabms1974/Saturno.git
cd Saturno
```

### 2. Instalar as dependências do backend

```bash
cd backend
npm install
```

> 💡 Se aparecer erro do `better-sqlite3`, confirme que está usando Node 20+. A versão `^12.9.0` do pacote tem binários pré-compilados para Node moderno.

### 3. Subir o servidor

```bash
npm run dev
```

Deve aparecer:

```
🪐 Saturno rodando em http://localhost:3000
```

### 4. Abrir no navegador

Acesse **[http://localhost:3000](http://localhost:3000)**

> ⚠️ O `npm run dev` **prende o terminal**. Se fechar essa janela, o servidor cai e o navegador exibe `ERR_CONNECTION_REFUSED`. Deixe um terminal aberto só para isso.

> 🌍 Para usar a **geolocalização**, autorize o navegador a acessar sua localização quando ele pedir. Localmente (`localhost`) o navegador permite sem HTTPS.

---

## 🧪 Rodando os testes

O projeto inclui **86 testes automatizados** em três arquivos, cobrindo as regras de negócio e o CRUD completo das duas camadas (operacional e gestora):

- `tests/mvp.test.js` — regras de negócio da camada operacional (RN01, RN02, RN03, RN06)
- `tests/gestao.test.js` — regras de negócio da camada gestora (RN04, RN07)
- `tests/full.test.js` — suíte de ponta a ponta cobrindo **todas** as rotas da API, validações e casos de erro

```bash
cd backend
npm test
```

Cada arquivo roda em seu próprio banco isolado (`data/test*.db`) e não afeta o banco real (`data/tempo_parado.db`).

Saída esperada:

```
▶ RN01 — Ponto de partida não conta tempo parado
  ✔ Ponto de ordem 1 sempre retorna tempo_parado_min = 0
  ✔ Registrar chegada/saída via API no ponto 1 mantém tempo 0
▶ RN02 — Tempo parado = saída − chegada
  ✔ Diferença exata em minutos é calculada corretamente
  ...
ℹ tests 86
ℹ pass 86
ℹ fail 0
```

Os testes usam um **banco isolado** (`data/test.db`), então **não afetam** os dados reais.

### O que é testado

| Bloco                             | O que valida                                            |
|-----------------------------------|---------------------------------------------------------|
| RN01 — Ponto de partida           | Ordem 1 sempre retorna tempo parado = 0                 |
| RN02 — Cálculo do tempo           | Diferença entre saída e chegada, inclusive via API      |
| RN03 — Tempo total do roteiro     | Soma todos os pontos, menos a partida                   |
| RN06 — Ordem sequencial           | Pontos recebem ordem 1, 2, 3… automaticamente           |
| CRUD Motorista                    | Criar, listar, atualizar, excluir, validação            |
| CRUD Roteiro                      | Criação, validação, cascade delete                      |
| CRUD Ponto                        | Criação, validação, cascade delete                      |
| Verificação cruzada               | Exemplo do enunciado (Roteiro A = 65 min parado)        |

---

## 🌐 Endpoints da API

Base URL: `http://localhost:3000/api`

### Motoristas

| Método | Rota                | Descrição                    |
|--------|---------------------|------------------------------|
| GET    | `/motoristas`       | Lista todos                  |
| GET    | `/motoristas/:id`   | Busca um por ID              |
| POST   | `/motoristas`       | Cria                         |
| PUT    | `/motoristas/:id`   | Atualiza                     |
| DELETE | `/motoristas/:id`   | Remove                       |

### Roteiros

| Método | Rota                | Descrição                                    |
|--------|---------------------|----------------------------------------------|
| GET    | `/roteiros`         | Lista todos (com nome do motorista)          |
| GET    | `/roteiros/:id`     | Detalhe + pontos ordenados + tempo total     |
| POST   | `/roteiros`         | Cria                                         |
| PUT    | `/roteiros/:id`     | Atualiza                                     |
| DELETE | `/roteiros/:id`     | Remove (e apaga os pontos em cascata)        |

### Pontos

| Método | Rota                            | Descrição                                            |
|--------|---------------------------------|------------------------------------------------------|
| GET    | `/pontos/roteiro/:roteiroId`    | Lista pontos de um roteiro, em ordem                 |
| GET    | `/pontos/:id`                   | Busca um ponto                                       |
| POST   | `/pontos`                       | Cria ponto (ordem automática)                        |
| POST   | `/pontos/:id/chegada`           | Registra chegada (+ coords opcionais)                |
| POST   | `/pontos/:id/saida`             | Registra saída (recalcula tempo parado, + coords)    |
| PUT    | `/pontos/:id`                   | Atualiza                                             |
| DELETE | `/pontos/:id`                   | Remove                                               |

### Parâmetros

| Método | Rota                   | Descrição                                                      |
|--------|------------------------|-----------------------------------------------------------------|
| GET    | `/parametros/vigente`  | Retorna o parâmetro de custo/jornada em vigor no momento         |
| GET    | `/parametros/historico`| Lista todas as vigências já cadastradas                         |
| POST   | `/parametros`          | Cria um novo parâmetro (fecha a vigência do anterior)            |

### Dashboard

| Método | Rota          | Descrição                                                                |
|--------|---------------|---------------------------------------------------------------------------|
| GET    | `/dashboard`  | Indicadores agregados (tempo parado, custo, jornada). Filtros: `inicio`, `fim`, `motorista_id` (query string) |

### Relatórios

| Método | Rota                    | Descrição                                              |
|--------|-------------------------|---------------------------------------------------------|
| GET    | `/relatorios/historico` | Lista uma linha por roteiro, com custo e jornada (mesmos filtros do dashboard) |
| GET    | `/relatorios/exportar`  | Exporta o histórico filtrado em CSV                     |

### Exemplo de uso (curl)

```bash
# Criar motorista
curl -X POST http://localhost:3000/api/motoristas \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","veiculo":"CG 160","rendimento_km_l":35}'

# Criar roteiro
curl -X POST http://localhost:3000/api/roteiros \
  -H "Content-Type: application/json" \
  -d '{"data":"2026-09-22","motorista_id":1,"distancia_total_km":42}'

# Registrar chegada com coordenadas
curl -X POST http://localhost:3000/api/pontos/1/chegada \
  -H "Content-Type: application/json" \
  -d '{"data_hora_chegada":"2026-09-22T08:00:00","latitude":-19.92,"longitude":-43.93}'
```

---

## 🗄️ Modelo de Dados

### `motorista`

| Campo            | Tipo    | Observação                |
|------------------|---------|---------------------------|
| id               | INTEGER | PK, auto incremento       |
| nome             | TEXT    | Obrigatório               |
| telefone         | TEXT    |                           |
| documento        | TEXT    | Único                     |
| veiculo          | TEXT    |                           |
| rendimento_km_l  | REAL    | Consumo do veículo        |
| criado_em        | TEXT    | Timestamp automático      |

### `roteiro`

| Campo              | Tipo    | Observação                              |
|--------------------|---------|-----------------------------------------|
| id                 | INTEGER | PK                                      |
| data               | TEXT    | Formato `YYYY-MM-DD`                    |
| motorista_id       | INTEGER | FK → motorista(id)                      |
| distancia_total_km | REAL    |                                         |
| criado_em          | TEXT    | Timestamp automático                    |

### `ponto`

| Campo               | Tipo    | Observação                                 |
|---------------------|---------|--------------------------------------------|
| id                  | INTEGER | PK                                         |
| roteiro_id          | INTEGER | FK → roteiro(id), CASCADE                  |
| ordem               | INTEGER | Sequencial: 1 = partida, 2, 3…             |
| endereco            | TEXT    | Obrigatório                                |
| latitude            | REAL    | Capturada por geolocalização               |
| longitude           | REAL    | Capturada por geolocalização               |
| data_hora_chegada   | TEXT    | ISO 8601                                   |
| data_hora_saida     | TEXT    | ISO 8601                                   |
| tempo_parado_min    | INTEGER | Calculado automaticamente                  |

### `parametro`

| Campo              | Tipo    | Observação                                              |
|--------------------|---------|----------------------------------------------------------|
| id                 | INTEGER | PK                                                       |
| preco_combustivel  | REAL    | R$/litro, usado na RN07                                  |
| jornada_horas_dia  | REAL    | Default 8, usada na RN04                                 |
| vigencia_inicio    | TEXT    | Timestamp em que o parâmetro passou a valer              |
| vigencia_fim       | TEXT    | Preenchido automaticamente quando um novo parâmetro entra em vigor; `NULL` = vigente |

---

## 🗺️ Fluxo de uso (dia a dia)

1. **Cadastrar motorista** → `Motoristas` no menu
2. **Criar roteiro do dia** → `Roteiros` (escolher motorista + data)
3. **Adicionar pontos do roteiro** → `Pontos`
   - Opção **📍 Usar minha localização** preenche lat/long + endereço automaticamente
   - É possível **editar** qualquer ponto já cadastrado
4. **Registrar chegada/saída em campo** → `Registrar Ponto`
   - Ao clicar em **Chegada**, o sistema captura **data/hora + localização**
   - Ao clicar em **Saída**, o sistema calcula o tempo parado
   - Ponto #1 (partida) sempre fica com **0 min** — RN01
5. **Configurar custos/jornada** (opcional, mas recomendado) → `Parâmetros` (preço do combustível e jornada padrão)
6. **Analisar o resultado** → `Dashboard` (KPIs e gráficos por período/motorista) e `Histórico` (tabela detalhada + exportação CSV)

---

## 📚 Documentação — Projeto Preliminar

Na pasta `artefatos/` estão os entregáveis do **Projeto Preliminar**:

### ✅ Casos de Uso (produzidos)

| Código | Nome                                | Ator                |
|--------|-------------------------------------|---------------------|
| UC01   | Cadastrar Motorista / Motoboy       | Gerente/Coordenador |
| UC02   | Cadastrar Roteiro                   | Gerente/Coordenador |
| UC03   | Cadastrar Ponto no Roteiro          | Gerente/Coordenador |
| UC04   | Registrar Chegada/Saída em Ponto    | Motorista/Motoboy   |
| UC05   | Consultar Dashboard                 | Gerente/Coordenador |
| UC06   | Parametrizar Custos/Jornada         | Gerente/Coordenador |
| UC07   | Gerar Histórico/Relatórios          | Gerente/Coordenador |

### ✅ Diagramas de Robustez (produzidos)

- **Camada operacional (Marco)** — UC01 a UC04, em `diagramas-robustez-operacional.md`
- **Camada gestora (Paulo)** — UC05 a UC07, em `diagramas-robustez-gestor.md`

### ✅ Diagrama de Classes (produzido)

- **Foco operacional (Marco)** — `Motorista`, `Roteiro`, `Ponto`, em `diagrama-classes-operacional.md`
- **Foco analítico/configurações (Paulo)** — adiciona `Parametro`, em `diagrama-classes-gestao.md`

---

## 👥 Equipe e divisão do trabalho

| Integrante | Responsabilidade                                                            | Progresso |
|------------|------------------------------------------------------------------------------|:---------:|
| **Marco**  | Cadastros, operação de campo (chegada/saída), geolocalização, RN01/RN02/RN03/RN06 | 🟢 100% |
| **Paulo**  | Dashboard, histórico, parâmetros de custo, indicadores analíticos           | 🟢 100% |

---

## 📝 Licença

Projeto acadêmico — **Engenharia de Software II — PUC Minas**
Prof. Sandro Laudares · 2026
