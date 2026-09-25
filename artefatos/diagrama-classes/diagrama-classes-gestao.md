# Diagrama de Classes — Camada Gestora (Paulo)

Integra as entidades já modeladas por Marco (`Motorista`, `Roteiro`, `Ponto`) com a entidade
`Parametro`, introduzida pela camada gestora.

```mermaid
classDiagram
    class Motorista {
        +int id
        +string nome
        +string telefone
        +string documento
        +string veiculo
        +float rendimentoKmL
    }

    class Roteiro {
        +int id
        +date data
        +int motoristaId
        +float distanciaTotalKm
    }

    class Ponto {
        +int id
        +int roteiroId
        +int ordem
        +string endereco
        +datetime dataHoraChegada
        +datetime dataHoraSaida
        +int tempoParadoMin
    }

    class Parametro {
        +int id
        +float precoCombustivel
        +float jornadaHorasDia
        +datetime vigenciaInicio
        +datetime vigenciaFim
    }

    class DashboardService {
        +calcularCustoRoteiro(distanciaKm, rendimentoKmL, precoCombustivel) float
        +calcularJornada(horasTrabalhadas, jornadaHorasDia) Jornada
        +indicadores(filtro) Indicadores
        +historico(filtro) List~LinhaHistorico~
    }

    Motorista "1" --> "*" Roteiro : realiza
    Roteiro "1" --> "*" Ponto : possui
    Roteiro "*" --> "1" Parametro : referencia (vigente no dia)
    DashboardService --> Roteiro : consulta
    DashboardService --> Ponto : consulta
    DashboardService --> Parametro : consulta
```

**Notas de modelagem:**

- `DashboardService` não é uma entidade persistida — representa a camada de serviço
  (`dashboardModel.js`) que agrega dados das entidades já existentes.
- `Parametro` é versionado por vigência (`vigenciaInicio`/`vigenciaFim`) para que roteiros
  antigos continuem refletindo o custo/jornada vigentes na época em que foram executados.
- `Ponto.tempoParadoMin` e `Ponto.ordem` são calculados pela camada operacional (RN01/RN02/RN03/RN06)
  e apenas consumidos, somados e agregados pela camada gestora.
