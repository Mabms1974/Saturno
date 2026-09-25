# Diagramas de Robustez — Camada Gestora (v2)

Atualização em relação a `diagramas-robustez-gestor.md`: adicionado o diagrama de robustez
do UC08 — Cadastrar Gerente.

## UC05 — Consultar Dashboard

```mermaid
graph LR
    A((Gerente)) --> B[Tela Dashboard]
    B --> C(Controle Dashboard)
    C --> D{{Entidade Roteiro}}
    C --> E{{Entidade Ponto}}
    C --> F{{Entidade Parametro}}
    C --> G[Tela Gráficos/KPIs]
```

## UC06 — Parametrizar Custos/Jornada

```mermaid
graph LR
    A((Gerente)) --> B[Tela Parâmetros]
    B --> C(Controle Parametrização)
    C --> D{{Entidade Parametro}}
    C --> E[Tela Confirmação/Histórico]
```

## UC07 — Gerar Histórico/Relatórios

```mermaid
graph LR
    A((Gerente)) --> B[Tela Histórico]
    B --> C(Controle Histórico/Relatórios)
    C --> D{{Entidade Roteiro}}
    C --> E{{Entidade Ponto}}
    C --> F{{Entidade Parametro}}
    C --> G(Gerador de CSV)
    G --> H[Arquivo CSV]
```

## UC08 — Cadastrar Gerente

```mermaid
graph LR
    A((Administrador/Dono)) --> B[Tela Cadastro de Gerente]
    B --> C(Controle Gerente)
    C --> D{{Entidade Gerente}}
    C --> E[Tela Alerta de Erro]
    C --> F[Tela Lista de Gerentes]
```

- `C → D`: valida campos obrigatórios (nome, e-mail) e grava; a **RN de e-mail único** é
  verificada pelo banco (constraint `UNIQUE`) e traduzida pelo controle em mensagem amigável.
- `C → E`: acionado nos fluxos alternativos FA01 (campo obrigatório em branco), FA02
  (e-mail duplicado) e FA03 (e-mail em formato inválido).
- `C → F`: em caso de sucesso, recarrega a lista de gerentes exibida na tela.
