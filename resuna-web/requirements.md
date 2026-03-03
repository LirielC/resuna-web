# Resuna Web - Requirements Document

## Introduction

Resuna Web is a SaaS platform that enables users to create ATS-optimized resumes (Applicant Tracking Systems), analyze job compatibility using NLP analysis, and optionally refine resumes using generative AI (Gemini API). The system monetizes via monthly subscription through Paddle. All infrastructure runs on Firebase, Google Cloud, and Vercel.

**Target Market:** United States and United Kingdom (English-speaking users)
**App Language:** English (US/UK)

## Glossary

- **Resuna_Web**: Web application (Next.js) accessible via browser
- **Backend_API**: Node.js service hosted on Cloud Run
- **ATS_Engine**: FastAPI service (Python) for compatibility analysis
- **Resume_JSON**: Structured representation of resume in JSON format
- **ATS_Score**: Score from 0-100 indicating ATS compatibility
- **AI_Refine**: Premium process to improve resume using Gemini API
- **AI_Translate**: Premium feature to translate resume to other languages via Gemini
- **Paddle**: Merchant of Record payment platform

---

## Functional Requirements

### Requirement 1: Criação de Currículo

**User Story:** Como um usuário, eu quero criar um currículo estruturado, para que eu tenha um documento profissional.

#### Acceptance Criteria

1. WHEN o usuário acessa /resumes/new, THE App SHALL exibir formulário de criação
2. THE App SHALL permitir adicionar: dados básicos, experiências, educação, skills, certificações, idiomas
3. WHEN o usuário edita, THE App SHALL mostrar preview do PDF em tempo real
4. THE App SHALL auto-salvar a cada 30 segundos
5. WHEN o usuário salva, THE Backend_API SHALL persistir no Firestore

### Requirement 2: Edição de Currículo

**User Story:** Como um usuário, eu quero editar meu currículo, para que eu o mantenha atualizado.

#### Acceptance Criteria

1. WHEN o usuário acessa /resumes/:id, THE App SHALL carregar dados do currículo
2. THE App SHALL permitir editar todas as seções
3. THE App SHALL permitir reordenar experiências e educação via drag-and-drop
4. WHEN o usuário modifica campos, THE App SHALL atualizar preview em tempo real

### Requirement 3: Geração de PDF ATS-Friendly

**User Story:** Como um usuário, eu quero gerar um PDF do meu currículo, para que eu possa enviá-lo para vagas.

#### Acceptance Criteria

1. WHEN o usuário clica em "Baixar PDF", THE Backend_API SHALL gerar PDF
2. THE PDF gerado SHALL usar fonte padrão (Arial, Calibri), sem tabelas, sem imagens
3. THE PDF SHALL ter estrutura parseável por sistemas ATS
4. THE PDF SHALL refletir idioma escolhido (PT-BR ou EN)

### Requirement 4: Geração de DOCX

**User Story:** Como um usuário, eu quero baixar meu currículo em Word, para que eu atenda empresas que pedem DOCX.

#### Acceptance Criteria

1. WHEN o usuário clica em "Baixar Word", THE Backend_API SHALL gerar DOCX
2. THE DOCX gerado SHALL manter formatação profissional
3. THE DOCX SHALL ser editável no Microsoft Word e Google Docs

### Requirement 5: Upload de Vaga

**User Story:** Como um usuário, eu quero cadastrar uma vaga, para que eu possa analisar compatibilidade.

#### Acceptance Criteria

1. WHEN o usuário acessa análise, THE App SHALL permitir colar texto da vaga
2. THE App SHALL permitir upload de arquivo (PDF, DOCX, TXT)
3. WHEN arquivo é enviado, THE Backend_API SHALL extrair texto
4. THE Sistema SHALL armazenar vaga no Firestore

### Requirement 6: Análise ATS

**User Story:** Como um usuário, eu quero analisar meu currículo contra uma vaga, para saber minha compatibilidade.

#### Acceptance Criteria

1. WHEN o usuário solicita análise, THE Backend_API SHALL enviar para ATS_Engine
2. THE ATS_Engine SHALL extrair requisitos da vaga (must-have, nice-to-have)
3. THE ATS_Engine SHALL comparar com skills do currículo
4. THE Sistema SHALL retornar score de 0-100 e lista de matches/gaps
5. THE App SHALL exibir resultado com visualização clara

### Requirement 7: Refino com IA (Premium)

**User Story:** Como um usuário premium, eu quero que a IA melhore meu currículo, para aumentar minha compatibilidade.

#### Acceptance Criteria

1. WHEN o usuário solicita refino, THE App SHALL verificar assinatura ativa
2. IF assinatura ativa OR créditos disponíveis, THE Backend_API SHALL chamar Gemini API
3. THE Sistema SHALL enviar: gaps da análise, bullets atuais, requisitos da vaga
4. THE Gemini SHALL sugerir melhorias sem inventar experiências
5. THE App SHALL mostrar diff antes/depois para aprovação

### Requirement 8: Carta de Apresentação (Premium)

**User Story:** Como um usuário premium, eu quero gerar uma carta de apresentação, para ter candidatura completa.

#### Acceptance Criteria

1. WHEN o usuário solicita carta, THE Backend_API SHALL chamar Gemini API
2. THE Gemini SHALL gerar carta de ~300 palavras baseada no currículo e vaga
3. THE App SHALL permitir editar carta antes de exportar
4. THE App SHALL permitir exportar como PDF ou DOCX

### Requirement 9: Resume Translation (Premium)

**User Story:** As a user, I want to translate my resume to other languages, so I can apply for international jobs.

#### Acceptance Criteria

1. THE App interface SHALL be entirely in English (US/UK target market)
2. THE App SHALL offer AI-powered resume translation as a premium feature
3. THE supported target languages SHALL be:
   - Portuguese (PT-BR)
   - French (FR)
   - Spanish (ES)
   - Japanese (JA)
4. WHEN user requests translation, THE Backend_API SHALL call Gemini API
5. THE Gemini SHALL translate all resume content while preserving formatting and professional tone
6. THE App SHALL create a new resume copy in the target language
7. THE translated resume SHALL be editable after translation
8. THE App SHALL allow downloading translated resume as PDF/DOCX
9. WHEN translating, THE Sistema SHALL preserve proper nouns (names, companies, institutions)

### Requirement 10: Multiple Resumes

**User Story:** As a user, I want to have different versions of my resume, so I can customize for each job.

#### Acceptance Criteria

1. THE App SHALL allow creating multiple resumes
2. THE App SHALL allow naming resumes (e.g., "Resume - Google Position")
3. WHEN user analyzes a job, THE App SHALL offer "Create version for this job"

---

## Authentication Requirements

### Requirement 11: Login

**User Story:** Como um usuário, eu quero fazer login, para acessar meus dados.

#### Acceptance Criteria

1. THE App SHALL oferecer login com Google (OAuth)
2. THE App SHALL oferecer login com email/senha
3. THE App SHALL oferecer Magic Link (email sem senha)
4. WHEN login bem-sucedido, THE App SHALL criar sessão segura

### Requirement 12: Signup

**User Story:** Como um novo usuário, eu quero criar uma conta, para usar o sistema.

#### Acceptance Criteria

1. THE App SHALL permitir criar conta com Google ou email
2. WHEN conta é criada, THE App SHALL enviar email de boas-vindas
3. WHEN conta é criada, THE Sistema SHALL iniciar período de trial (3 dias)

### Requirement 13: Segurança

**User Story:** Como um usuário, eu quero que meus dados estejam seguros.

#### Acceptance Criteria

1. THE Sistema SHALL usar HTTPS em todas as comunicações
2. THE Sistema SHALL usar cookies httpOnly e secure
3. THE Sistema SHALL validar Firebase token em todas as requests autenticadas
4. THE Firestore SHALL restringir acesso por userId via Security Rules

---

## Billing Requirements

### Requirement 14: Visualizar Planos

**User Story:** Como um usuário, eu quero ver os planos disponíveis, para decidir qual assinar.

#### Acceptance Criteria

1. THE App SHALL display comparison: Free vs Premium
2. THE App SHALL show monthly plan ($9.99/month) and yearly plan ($99.99/year)
3. THE App SHALL highlight yearly plan discount (save 17%)

### Requirement 15: Assinar Premium

**User Story:** Como um usuário, eu quero assinar o plano premium, para usar todas as funcionalidades.

#### Acceptance Criteria

1. WHEN o usuário clica em assinar, THE App SHALL redirecionar para Stripe Checkout
2. WHEN pagamento confirmado, THE Sistema SHALL ativar assinatura imediatamente
3. THE Sistema SHALL enviar email de confirmação

### Requirement 16: Free Trial

**User Story:** Como um novo usuário, eu quero testar o premium, para decidir se vale.

#### Acceptance Criteria

1. THE Sistema SHALL oferecer 3 dias de trial para novos usuários
2. WHEN trial expira sem pagamento, THE Sistema SHALL limitar funcionalidades
3. THE App SHALL mostrar dias restantes do trial

### Requirement 17: Gerenciar Assinatura

**User Story:** Como um assinante, eu quero gerenciar minha assinatura, para cancelar ou trocar plano.

#### Acceptance Criteria

1. WHEN o usuário acessa /billing, THE App SHALL mostrar status da assinatura
2. THE App SHALL permitir abrir Stripe Customer Portal
3. THE Portal SHALL permitir cancelar, trocar plano, atualizar cartão

### Requirement 18: Comprar Refinos Avulsos

**User Story:** Como um usuário, eu quero comprar refinos sem assinar, para usar ocasionalmente.

#### Acceptance Criteria

1. THE App SHALL offer packages: 5 refines ($4.99), 15 ($12.99), 50 ($29.99)
2. WHEN purchase completed, THE Sistema SHALL add credits to account
3. THE App SHALL show remaining credits
4. THE translation feature SHALL consume 1 credit per translation

---

## Sharing Requirements

### Requirement 19: Compartilhar via Link

**User Story:** Como um usuário, eu quero compartilhar meu currículo via link, para enviar a recrutadores.

#### Acceptance Criteria

1. WHEN o usuário gera link, THE Sistema SHALL criar URL pública
2. THE Link SHALL expirar após período configurável (default 7 dias)
3. THE Sistema SHALL contar visualizações do link
4. THE usuário SHALL poder revogar link a qualquer momento

### Requirement 20: QR Code

**User Story:** Como um usuário, eu quero um QR Code do currículo, para eventos de networking.

#### Acceptance Criteria

1. WHEN link público existe, THE App SHALL gerar QR Code
2. THE App SHALL permitir baixar QR Code como imagem

### Requirement 21: Compartilhar PDF

**User Story:** Como um usuário, eu quero compartilhar o PDF diretamente.

#### Acceptance Criteria

1. THE App SHALL permitir baixar PDF
2. THE App SHALL oferecer botão de compartilhar (Web Share API)

---

## Dashboard Requirements

### Requirement 22: Métricas do Usuário

**User Story:** Como um usuário, eu quero ver minhas estatísticas, para acompanhar evolução.

#### Acceptance Criteria

1. THE Dashboard SHALL mostrar: total de currículos, análises, score médio
2. THE Dashboard SHALL exibir gráfico de evolução do score
3. THE Dashboard SHALL listar skills mais faltantes nas análises

---

## Non-Functional Requirements

### Requirement 23: Performance

**User Story:** Como um usuário, eu quero que o site seja rápido, para ter boa experiência.

#### Acceptance Criteria

1. THE App SHALL ter LCP < 2.5 segundos
2. THE App SHALL ter FID < 100ms
3. THE App SHALL ter CLS < 0.1
4. THE Backend_API SHALL responder em < 500ms (exceto IA)

### Requirement 24: Acessibilidade

**User Story:** Como um usuário com deficiência, eu quero usar o site com tecnologias assistivas.

#### Acceptance Criteria

1. THE App SHALL ter score Lighthouse Accessibility > 90
2. THE App SHALL ser navegável por teclado
3. THE App SHALL ter contraste adequado (WCAG AA)
4. THE App SHALL respeitar preferência de movimento reduzido

### Requirement 25: Responsividade

**User Story:** Como um usuário, eu quero usar o site no celular e computador.

#### Acceptance Criteria

1. THE App SHALL funcionar em telas de 320px a 2560px
2. THE layouts SHALL adaptar para mobile, tablet e desktop
3. THE editor de currículo SHALL ser usável em mobile

### Requirement 26: Modo Escuro

**User Story:** Como um usuário, eu quero usar o site em modo escuro.

#### Acceptance Criteria

1. THE App SHALL suportar tema claro e escuro
2. THE App SHALL seguir preferência do sistema por default
3. THE App SHALL permitir mudar tema manualmente

### Requirement 27: SEO

**User Story:** Como dono do produto, eu quero que o site apareça no Google.

#### Acceptance Criteria

1. THE landing page SHALL ter meta tags otimizadas
2. THE páginas públicas SHALL ter sitemap.xml
3. THE App SHALL usar URLs semânticas

---

## Compliance Requirements

### Requirement 28: LGPD

**User Story:** Como um usuário, eu quero controle sobre meus dados.

#### Acceptance Criteria

1. THE App SHALL exibir aviso de cookies na primeira visita
2. THE App SHALL permitir exportar todos os dados (GDPR/LGPD export)
3. THE App SHALL permitir deletar conta permanentemente
4. THE Sistema SHALL registrar consentimentos

### Requirement 29: Termos e Políticas

**User Story:** Como um usuário, eu quero ver os termos de uso.

#### Acceptance Criteria

1. THE App SHALL ter página /terms com Termos de Uso
2. THE App SHALL ter página /privacy com Política de Privacidade
3. O signup SHALL requerer aceite dos termos

---

## Error Handling Requirements

### Requirement 30: Feedback de Erros

**User Story:** Como um usuário, eu quero saber quando algo deu errado.

#### Acceptance Criteria

1. WHEN erro ocorre, THE App SHALL mostrar mensagem amigável
2. THE App SHALL oferecer opção de tentar novamente
3. WHEN erro é de rede, THE App SHALL informar problema de conexão
4. WHEN erro é do servidor, THE App SHALL informar "tente novamente mais tarde"

---

## Analytics Requirements

### Requirement 31: Tracking de Eventos

**User Story:** Como dono do produto, eu quero entender como usuários usam o app.

#### Acceptance Criteria

1. THE App SHALL trackear: page views, signups, conversões, feature usage
2. THE App SHALL usar Google Analytics ou Mixpanel/Amplitude
3. THE App SHALL respeitar opt-out de tracking
