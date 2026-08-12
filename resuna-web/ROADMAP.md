# Roadmap do Resuna

O Resuna continuará gratuito, open-source e simples de operar. A evolução será incremental: cada etapa deve melhorar a experiência sem exigir uma reescrita completa do sistema.

## Fase 1 — Workspace do editor

Status: em andamento

- Navegação lateral por seções do currículo.
- Formulário central focado na edição.
- Preview persistente do documento no desktop.
- Preview alternável no mobile.
- Barra de ações para completude, ATS, IA e exportação.
- Estados de salvamento e feedback visual mais claros.

## Fase 2 — Editor e templates

- Definir um modelo de dados canônico para todos os formatos.
- Criar exatamente três templates ATS-friendly:
  - Classic;
  - Modern;
  - Compact.
- Permitir escolher o template sem duplicar o currículo.
- Melhorar a pré-visualização para refletir o PDF real.
- Adicionar autosave com debounce e indicador de alterações pendentes.

## Fase 3 — Renderização

- Criar o serviço `renderer` em Go.
- Usar o compilador Typst como dependência fixada no container.
- Gerar PDF a partir de dados JSON e templates Typst controlados pelo Resuna.
- Adicionar cache por hash do conteúdo e do template.
- Manter o exportador DOCX atual durante a transição.

## Fase 4 — Inteligência

- Consolidar ATS, NLP, importação e IA em Python/FastAPI.
- Separar análise determinística de funcionalidades generativas.
- Padronizar contratos entre frontend, Spring Boot e serviços Python.
- Exibir explicações acionáveis para cada recomendação ATS.

## Fase 5 — Infraestrutura e qualidade

- Manter Spring Boot como núcleo de autenticação, usuários e currículos.
- Adicionar contratos versionados para os serviços.
- Expandir testes E2E para criação, edição, análise e exportação.
- Adicionar testes de regressão visual dos três templates.
- Fixar versões de Node, Java, Python, Go e Typst no CI/CD.
- Documentar setup local sem exigir credenciais de produção.

## Critérios de sucesso

- Um novo usuário consegue criar e exportar um currículo sem procurar a navegação.
- O preview permanece compreensível enquanto o formulário é editado.
- Os três modelos preservam texto selecionável, links e estrutura legível por ATS.
- Cada serviço pode ser testado e executado localmente de forma independente.
- Nenhuma etapa exige assinatura paga ou serviço proprietário obrigatório.
