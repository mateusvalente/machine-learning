# WAF com IA — kit do aluno

Este ambiente já contém Nginx, PHP-FPM, um serviço Python de decisão e uma página de teste. A única parte a ser alterada pelo aluno é `student/model.py`.

## Pré-requisito

Instale o Docker Desktop e confirme que ele está em execução.

## Executar

No terminal, dentro desta pasta, execute:

```bash
docker compose up --build
```

Abra `http://localhost:8080/testar.html`. A página oferece duas requisições:

- **Normal:** deve receber `200` e a resposta do PHP.
- **Suspeita:** inicialmente também recebe `200`, porque o modelo de exemplo permite tudo. Depois de implementar o classificador, ela deve receber `403`.

Para encerrar, use `docker compose down`.

## Onde implementar o algoritmo

Edite somente `student/model.py`. A função `predict_risk(features)` recebe um dicionário de atributos e deve devolver um número entre `0.0` (normal) e `1.0` (suspeita). O limiar inicial está em `0.60` no serviço; ele pode ser ajustado depois da validação.

Após editar o algoritmo, reconstrua a imagem:

```bash
docker compose up --build
```

## Dataset

O arquivo `../../assets/datasets/requisicoes_waf.csv` contém exemplos rotulados. `label` é o alvo; não o use como entrada. As entradas disponíveis são:

| Campo | Significado |
|---|---|
| `method` | Método HTTP da requisição. |
| `path` | Caminho solicitado. |
| `query_length` | Tamanho da query string. |
| `body_length` | Tamanho do corpo HTTP. |
| `has_encoded_chars` | Há caracteres percent-encoded? (`0` ou `1`) |
| `special_char_count` | Quantidade de caracteres especiais. |
| `rate_1m` | Volume de requisições no último minuto. |
| `source_reputation` | Exemplo didático de reputação da origem, entre `0` e `1`. |

O serviço de exemplo extrai os atributos possíveis em tempo de execução. Para um experimento completo, use o CSV para separar treino, validação e teste, codificar `method` e normalizar os atributos que exigirem escala comum.

## Arquitetura fornecida

`Navegador → Nginx → serviço do modelo → PHP`

Para cada rota em `/api/`, o Nginx executa uma sub-requisição interna ao serviço do modelo. Resultado `204` permite a passagem para o PHP; resultado `403` bloqueia a chamada antes de ela atingir a aplicação.

Este é um exercício didático. Um WAF de produção também exige autenticação, rate limiting confiável, logs centralizados, observabilidade, regras revisadas e resposta a incidentes.
