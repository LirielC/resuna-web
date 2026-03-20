# Sugestões de Melhorias Futuras — Resuna

## Alta Prioridade

### 1. Múltiplos templates de currículo
Atualmente existe apenas um template (clássico Times New Roman). Adicionar ao menos 2–3 opções (moderno, minimalista, criativo) aumentaria o apelo para diferentes setores (tech, design, finanças).

### 2. Salvar currículo traduzido vinculado ao original
Hoje o currículo traduzido é salvo como um novo documento independente. Seria melhor manter o vínculo (`originalResumeId`) para exibir os dois juntos no dashboard e permitir re-tradução automática quando o original é atualizado.

### 3. Exportação para LinkedIn (JSON Resume / formato de importação)
Gerar um arquivo no formato aceito pelo LinkedIn para importação direta, eliminando o preenchimento manual do perfil.

### 4. Análise de compatibilidade com vaga (ATS match %)
Já existe o endpoint ATS. Melhorar o fluxo: colar a descrição da vaga diretamente na página do currículo e ver o score em tempo real com sugestões de palavras-chave faltantes.

---

## Experiência do Usuário

### 5. Arrastar e reordenar seções
Permitir que o usuário reordene as seções do currículo (mover Projetos antes de Experiência, por exemplo) via drag-and-drop.

### 6. Pré-visualização do PDF em tempo real no editor
Em vez do preview HTML aproximado, renderizar o PDF real em um iframe/canvas ao lado do formulário, atualizado a cada salvamento.

### 7. Autocompletar de tecnologias e skills
Ao digitar skills/tecnologias, oferecer sugestões de um catálogo curado (ex: "Jav..." → "Java", "JavaScript", "JavaFX"). Reduz erros de digitação que prejudicam ATS.

### 8. Importação via LinkedIn URL
Preencher automaticamente o currículo a partir de um perfil LinkedIn público, usando scraping ou a API oficial.

### 9. Histórico de versões
Guardar snapshots do currículo (por data de edição) para o usuário poder voltar a uma versão anterior.

---

## Backend & Performance

### 10. Cache de exportação PDF/DOCX
Cachear o PDF gerado por um hash do conteúdo do currículo. Evita re-geração a cada download quando nada mudou. Pode usar Redis ou simplesmente o ETag HTTP.

### 11. Substituir localStorage por sincronização com backend
Atualmente os dados de currículo ficam no `localStorage` do navegador. Migrar para Firestore como fonte de verdade com sincronização offline permitiria acesso de múltiplos dispositivos.

### 12. Rate limiting por usuário (não só por IP)
O rate limit atual é por IP. Adicionar rate limit por `userId` autenticado para prevenir abuso de endpoints de IA (tradução, análise ATS) por usuários que rotacionam IPs.

### 13. Fila de jobs para tradução/IA
Tradução e análise ATS são operações lentas. Usar uma fila (ex: Cloud Tasks) com webhook de conclusão evitaria timeouts em conexões lentas e permitiria reprocessamento em caso de falha.

### 14. Testes E2E mais abrangentes
Os 4 testes E2E pulados (autenticação) cobrem os fluxos mais importantes. Configurar um usuário de teste no Firebase para desbloquear esses cenários.

---

## Monetização & Negócio

### 15. Plano por assinatura mensal além de créditos
Oferecer um plano com créditos renovados mensalmente (ex: R$ 19/mês = 50 créditos/mês) além da compra avulsa atual.

### 16. Dashboard de uso para administradores
Expandir o painel admin com gráficos de uso por dia, taxa de conversão free→pago, currículos gerados por idioma etc.

### 17. Compartilhamento de currículo via link público
Gerar uma URL pública `/r/{slug}` que renderiza o currículo como página web, permitindo compartilhamento sem precisar baixar PDF.

### 18. Suporte a mais idiomas além de PT-BR → EN
Adicionar tradução para Espanhol (mercado latino) e Francês como próximas línguas.

---

## Segurança


