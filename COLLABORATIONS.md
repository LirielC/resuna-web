# Colaboracoes

![PRs Bem-vindos](https://img.shields.io/badge/PRs-bem--vindos-brightgreen?style=flat-square)
![Issues Abertas](https://img.shields.io/badge/Issues-abertas-blue?style=flat-square)
![Licenca MIT](https://img.shields.io/badge/Licenca-MIT-brightgreen?style=flat-square)
![Codigo de Conduta](https://img.shields.io/badge/Codigo_de_Conduta-Contributor_Covenant-purple?style=flat-square)

Obrigado pelo interesse em contribuir com o Resuna. Este documento descreve o processo para reportar problemas, sugerir melhorias e submeter codigo ao projeto.

---

## Conteudo

- [Codigo de conduta](#codigo-de-conduta)
- [Como reportar problemas](#como-reportar-problemas)
- [Como sugerir melhorias](#como-sugerir-melhorias)
- [Configuracao do ambiente](#configuracao-do-ambiente)
- [Fluxo de contribuicao](#fluxo-de-contribuicao)
- [Padroes de codigo](#padroes-de-codigo)
- [Testes](#testes)
- [Pull requests](#pull-requests)
- [Areas prioritarias](#areas-prioritarias)

---

## Codigo de conduta

Este projeto adota o [Contributor Covenant](https://www.contributor-covenant.org/), versao 2.1. Ao participar, voce concorda em manter um ambiente respeitoso e colaborativo para todos os envolvidos. Comportamentos prejudiciais, discriminatorios ou desrespeitosos resultarao em exclusao do projeto.

---

## Como reportar problemas

Antes de abrir um issue:

1. Verifique se o problema ja foi reportado na aba **Issues** do repositorio.
2. Confirme que o problema ocorre na versao mais recente do `main`.
3. Reproduza o problema com os passos minimos necessarios.

Ao abrir um issue, inclua:

- **Descricao clara** do que acontece e o que deveria acontecer
- **Passos para reproduzir** (numerados, objetivos)
- **Ambiente**: sistema operacional, versao do Node.js, versao do Java, navegador
- **Logs relevantes**: saida do terminal, erros do console do navegador, stack traces do backend
- **Capturas de tela** se o problema for visual

---

## Como sugerir melhorias

Sugestoes de funcionalidades sao bem-vindas. Use a aba **Issues** com o label `enhancement`. Descreva:

- O problema atual que a melhoria resolve
- A solucao proposta e como ela se encaixaria na arquitetura existente
- Alternativas consideradas
- Impacto esperado para os usuarios

---

## Configuracao do ambiente

Consulte a secao [Configuracao local](README.md#configuracao-local) do README para instrucoes completas. Resumidamente:

```bash
# Frontend
npm install
cp .env.local.example .env.local  # preencha as variaveis

# Backend
cd backend
# adicione backend/.env e backend/src/main/resources/firebase-admin-key.json
mvn spring-boot:run

# Motor ATS (opcional)
cd backend/ats-engine
pip install -r requirements.txt
python -m spacy download en_core_web_md
uvicorn main:app --reload --port 8000
```

---

## Fluxo de contribuicao

```
fork → branch → commits → testes → pull request → revisao → merge
```

### 1. Faca um fork e clone

```bash
git clone https://github.com/SEU_USUARIO/resuna-web.git
cd resuna-web
git remote add upstream https://github.com/ORIGINAL/resuna-web.git
```

### 2. Crie uma branch

Use nomes descritivos seguindo o padrao:

| Tipo | Padrao | Exemplo |
|---|---|---|
| Funcionalidade nova | `feat/descricao-curta` | `feat/export-json` |
| Correcao de bug | `fix/descricao-curta` | `fix/ats-score-null` |
| Refatoracao | `refactor/descricao-curta` | `refactor/auth-filter` |
| Documentacao | `docs/descricao-curta` | `docs/api-endpoints` |
| Testes | `test/descricao-curta` | `test/cover-letter-service` |

```bash
git checkout -b feat/minha-funcionalidade
```

### 3. Desenvolva e commite

Siga os padroes de codigo descritos abaixo. Commits devem ser atomicos e descritivos:

```bash
git commit -m "feat: adicionar exportacao em JSON para curriculos"
git commit -m "fix: corrigir calculo de score ATS com experiencia vazia"
git commit -m "test: adicionar testes para ExportService com PDF criptografado"
```

Prefixos aceitos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`.

### 4. Mantenha a branch atualizada

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Execute os testes

Antes de abrir o PR, todos os testes devem passar:

```bash
# TypeScript
cd resuna-web && npx tsc --noEmit

# Backend
cd resuna-web/backend && mvn test -Dspring.profiles.active=dev

# End-to-end (requer frontend e backend rodando)
cd resuna-web && npx playwright test --reporter=list
```

### 6. Abra o pull request

Envie a branch para o seu fork e abra o PR apontando para `main` do repositorio original.

---

## Padroes de codigo

### Frontend (TypeScript / React)

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-configurado-purple?style=flat-square&logo=eslint&logoColor=white)

- Tipagem estrita: sem `any` implicito
- Componentes funcionais com hooks; sem classes
- Props tipadas com interfaces nomeadas (prefixo `I` opcional, mas consistente no arquivo)
- Estilizacao exclusivamente via Tailwind CSS; evite CSS inline ou arquivos `.css` externos
- Rotas dinamicas do Next.js 15: `params` como `Promise<{id: string}>` + `use(params)` em client components
- Dados do usuario armazenados no `localStorage` via `localResumeStorage`; nao persista dados de curriculo no backend

### Backend (Java / Spring Boot)

![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-green?style=flat-square&logo=springboot&logoColor=white)

- Sem logica de negocio nos controllers; delegar para services
- Excecoes de dominio em `com.resuna.exception`; mapeamento no `GlobalExceptionHandler`
- Nunca logar PII (emails, IPs em texto puro, conteudo de curriculos); use hashes ou omissao
- Validacoes de entrada com Bean Validation (`@NotBlank`, `@Size`, `@Email`) nos modelos de request
- Testes unitarios e de integracao em `src/test/java/com/resuna/`; usar perfil `dev` com repositorios in-memory

### Motor ATS (Python)

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-teal?style=flat-square&logo=fastapi&logoColor=white)

- Validacao de entrada com Pydantic v2
- Sem subprocessos ou execucao de codigo externo
- Modelos spaCy carregados uma unica vez na inicializacao; falha rapida se nao instalados

### Seguranca

Qualquer contribuicao que envolva autenticacao, autorizacao, entrada de usuario, exportacao ou chamadas a APIs externas deve:

- Validar e sanitizar toda entrada na fronteira do sistema
- Evitar introducao de vulnerabilidades OWASP Top 10 (XSS, injecao, IDOR, etc.)
- Nunca incluir chaves de API, tokens ou credenciais no codigo ou commits
- Manter CAPTCHA obrigatorio nos endpoints de IA

---

## Testes

Toda contribuicao que adicione ou modifique comportamento deve incluir testes correspondentes.

| Camada | Framework | Local |
|---|---|---|
| Backend unitario / integracao | JUnit 5 + Spring Boot Test | `backend/src/test/java/com/resuna/` |
| End-to-end | Playwright | `tests/e2e/` |
| Tipagem estatica | TypeScript compiler | raiz do frontend |

Nao sao aceitos PRs que reduzam a cobertura de testes em areas modificadas sem justificativa explícita.

---

## Pull requests

Um bom PR:

- Resolve um unico problema ou adiciona uma unica funcionalidade
- Inclui descricao clara do que foi feito e por que
- Referencias o issue relacionado (`Closes #123` ou `Refs #123`)
- Passa em todos os testes e verificacoes de tipo
- Nao inclui arquivos gerados, dependencias, secrets ou binarios desnecessarios
- Tem commits limpos e bem descritos (rebase antes de abrir, se necessario)

O PR sera revisado por um mantenedor. Feedbacks serao dados como comentarios de revisao. Esteja preparado para iterar.

---

## Areas prioritarias

Contribuicoes nas seguintes areas sao especialmente bem-vindas:

- Novos templates de curriculo para exportacao em PDF e DOCX
- Suporte a mais idiomas na interface (internacionalizacao)
- Melhorias na precisao do motor ATS (metricas, algoritmos de matching)
- Testes end-to-end para fluxos de exportacao e analise ATS
- Acessibilidade (WCAG 2.1 AA) nos componentes de interface
- Documentacao de endpoints da API (OpenAPI / Swagger)

---

Qualquer duvida, abra um issue com o label `question`.
