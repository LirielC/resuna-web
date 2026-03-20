'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#F8F6F1',
        fontFamily: "'Crimson Pro', Georgia, serif",
      }}
    >
      {/* Navigation */}
      <nav className="relative z-40 px-8 lg:px-16 py-6 border-b" style={{ borderColor: '#E5E1DB' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-[28px] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              color: '#2A2824',
              letterSpacing: '-0.02em',
            }}
          >
            Resuna
          </Link>
          <Link
            href="/"
            className="text-[15px] transition-colors duration-300"
            style={{ color: '#6B6760' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#C46B48'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6B6760'}
          >
            Voltar ao início
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 lg:px-16 py-16">
        <h1
          className="text-[3rem] lg:text-[3.5rem] mb-4"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 500,
            color: '#2A2824',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Termos de Uso
        </h1>

        <p className="text-[15px] mb-12" style={{ color: '#8A847A' }}>
          Última atualização: 4 de março de 2026
        </p>

        <div className="prose prose-lg max-w-none">
          <style jsx>{`
            .prose {
              color: #5C5850;
              font-size: 17px;
              line-height: 1.8;
            }
            .prose h2 {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 1.75rem;
              font-weight: 500;
              color: #2A2824;
              margin-top: 3rem;
              margin-bottom: 1.5rem;
              letter-spacing: -0.01em;
            }
            .prose h3 {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 1.35rem;
              font-weight: 500;
              color: #2A2824;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            .prose p {
              margin-bottom: 1.25rem;
            }
            .prose ul, .prose ol {
              margin-bottom: 1.5rem;
              padding-left: 1.5rem;
            }
            .prose li {
              margin-bottom: 0.5rem;
            }
            .prose strong {
              color: #2A2824;
              font-weight: 600;
            }
            .prose a {
              color: #C46B48;
              text-decoration: none;
              transition: opacity 0.2s;
            }
            .prose a:hover {
              opacity: 0.7;
            }
          `}</style>

          <div className="prose">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma Resuna ("Plataforma" ou "Serviço"), você concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte deles, não deverá usar o Serviço.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              A Resuna é uma plataforma <strong>gratuita e open source</strong> que oferece:
            </p>
            <ul>
              <li>Criação e edição de currículos sincronizados na sua conta (armazenamento em nuvem no Firestore) quando autenticado</li>
              <li>Análise de compatibilidade com sistemas ATS (Applicant Tracking System), processada no servidor</li>
              <li>Refinamento de currículo e tradução via IA (OpenRouter API)</li>
              <li>Exportação de documentos em PDF e DOCX</li>
            </ul>
            <p>
              <strong>Todos os recursos são gratuitos.</strong> O código-fonte está disponível publicamente no GitHub e pode ser usado conforme os termos da licença do projeto.
            </p>

            <h2>3. Cadastro e Conta de Usuário</h2>

            <h3>3.1 Criação de Conta</h3>
            <ul>
              <li>O cadastro é feito exclusivamente via <strong>Google OAuth</strong> — não utilizamos autenticação por e-mail e senha</li>
              <li>Você deve ter pelo menos 18 anos para usar este Serviço</li>
              <li>É sua responsabilidade manter a segurança da conta Google associada</li>
            </ul>

            <h3>3.2 Segurança da Conta</h3>
            <ul>
              <li>Você é responsável por todas as atividades que ocorram sob sua conta</li>
              <li>Reservamo-nos o direito de suspender contas que violem estes Termos</li>
            </ul>

            <h2>4. Armazenamento de Dados</h2>
            <p>
              Com conta autenticada, o conteúdo dos seus <strong>currículos</strong> é armazenado no <strong>Google Cloud Firestore</strong>, associado ao seu UID, para sincronização entre dispositivos.
            </p>
            <ul>
              <li>Pode acessar os currículos da conta em qualquer dispositivo onde iniciar sessão</li>
              <li>Recomendamos exportações periódicas em JSON como cópia de segurança</li>
              <li>O acesso aos currículos na nuvem é técnico e restrito à operação do serviço; consulte a <Link href="/privacy">Política de Privacidade</Link> para detalhes</li>
            </ul>
            <p>
              No servidor, armazenamos também: resultados de análises ATS, dados de uso anonimizados e informações de autenticação necessárias ao funcionamento.
            </p>

            <h2>5. Uso Aceitável</h2>

            <h3>5.1 Você Concorda em NÃO:</h3>
            <ul>
              <li>Violar quaisquer leis ou regulamentos aplicáveis</li>
              <li>Tentar obter acesso não autorizado aos nossos sistemas</li>
              <li>Usar sistemas automatizados (bots, scrapers) para abusar do Serviço</li>
              <li>Criar currículos com informações falsas ou fraudulentas</li>
              <li>Explorar o Serviço para prejudicar outros usuários ou terceiros</li>
            </ul>

            <h3>5.2 Limites de Uso</h3>
            <p>
              O Serviço aplica limites de taxa (<em>rate limiting</em>) e CAPTCHA para operações de IA e análise ATS, com o objetivo de garantir a disponibilidade para todos os usuários.
            </p>

            <h2>6. Propriedade Intelectual</h2>

            <h3>6.1 Seu Conteúdo</h3>
            <ul>
              <li>Você mantém a propriedade de todo o conteúdo que cria usando o Serviço</li>
              <li>Ao usar os recursos de IA, você autoriza o envio do conteúdo necessário (texto do currículo, descrição da vaga) para a API OpenRouter, que o processa conforme seus próprios termos</li>
            </ul>

            <h3>6.2 Código Open Source</h3>
            <ul>
              <li>O código-fonte da Resuna é open source e está disponível publicamente no GitHub</li>
              <li>O uso, modificação e distribuição do código está sujeito à licença do projeto</li>
              <li>Nossas marcas e identidade visual não podem ser usadas sem permissão expressa</li>
            </ul>

            <h2>7. Recursos de IA</h2>

            <h3>7.1 Provedor de IA</h3>
            <p>
              Os recursos de IA (refinamento, tradução, etc.) utilizam a <strong>API OpenRouter</strong>, que roteia requisições para modelos de linguagem abertos de múltiplos provedores. O conteúdo do seu currículo é enviado a esse serviço para processamento.
            </p>

            <h3>7.2 Sua Responsabilidade</h3>
            <ul>
              <li>O conteúdo gerado por IA é fornecido sem garantias de precisão ou completude</li>
              <li>Você deve revisar e validar todo conteúdo antes de utilizá-lo</li>
              <li>Não inclua informações falsas ou enganosas no seu currículo</li>
            </ul>

            <h2>8. Serviços de Terceiros</h2>
            <p>
              Utilizamos os seguintes serviços de terceiros:
            </p>
            <ul>
              <li><strong>Firebase/Google Cloud:</strong> Autenticação e armazenamento de dados operacionais no servidor</li>
              <li><strong>OpenRouter:</strong> Processamento de requisições de IA</li>
              <li><strong>Cloudflare Turnstile:</strong> CAPTCHA para prevenção de abuso</li>
            </ul>
            <p>
              O uso desses serviços está sujeito aos respectivos termos e políticas de privacidade.
            </p>

            <h2>9. Privacidade e Proteção de Dados</h2>
            <p>
              Nossa coleta e uso de informações pessoais estão descritos em nossa <Link href="/privacy">Política de Privacidade</Link>, incorporada a estes Termos por referência.
            </p>

            <h2>10. Disponibilidade do Serviço</h2>
            <ul>
              <li>O Serviço é oferecido sem garantias de disponibilidade contínua</li>
              <li>Podemos suspender o Serviço para manutenção, atualizações ou por decisão do projeto</li>
              <li>Como projeto open source, qualquer pessoa pode hospedar sua própria instância</li>
              <li>Reservamo-nos o direito de modificar ou descontinuar recursos a qualquer momento</li>
            </ul>

            <h2>11. Limitação de Responsabilidade</h2>

            <h3>11.1 Sem Garantias</h3>
            <p>
              O SERVIÇO É FORNECIDO "COMO ESTÁ", SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS.
            </p>

            <h3>11.2 Limitação</h3>
            <p>
              COMO ESTE É UM SERVIÇO GRATUITO E OPEN SOURCE, NÃO ASSUMIMOS RESPONSABILIDADE POR DANOS DIRETOS OU INDIRETOS DECORRENTES DO USO DO SERVIÇO, INCLUINDO PERDA DE DADOS DO NAVEGADOR, RESULTADOS DE CANDIDATURAS A VAGAS OU AÇÕES DE SERVIÇOS DE TERCEIROS.
            </p>

            <h2>12. Rescisão</h2>

            <h3>12.1 Por Você</h3>
            <p>
              Você pode excluir sua conta a qualquer momento através da página <Link href="/account">Minha Conta</Link>. Antes de excluir, exporte seus currículos em JSON; a exclusão da conta remove os dados associados no servidor conforme a política de retenção.
            </p>

            <h3>12.2 Por Nós</h3>
            <p>
              Podemos suspender ou encerrar sua conta se você violar estes Termos ou se envolver em atividades que prejudiquem o Serviço ou outros usuários.
            </p>

            <h2>13. Lei Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil (Lei nº 13.709/2018 — LGPD e demais legislações aplicáveis), sem considerar conflitos de princípios legais.
            </p>

            <h2>14. Contato e Suporte</h2>
            <p>
              Por ser um projeto open source, o suporte e relato de problemas é feito via <strong>GitHub Issues</strong> no repositório do projeto. Não oferecemos suporte comercial por e-mail.
            </p>

            <h2>15. Lei Geral de Proteção de Dados (LGPD)</h2>
            <p>
              Em conformidade com a LGPD (Lei nº 13.709/2018), você possui os seguintes direitos:
            </p>
            <ul>
              <li>Direito de acessar, retificar ou excluir seus dados pessoais</li>
              <li>Direito à portabilidade de dados (exportação JSON disponível no app)</li>
              <li>Direito de se opor ao processamento</li>
              <li>Direito de apresentar reclamações à Autoridade Nacional de Proteção de Dados (ANPD)</li>
            </ul>
            <p>
              Consulte nossa <Link href="/privacy">Política de Privacidade</Link> para detalhes completos.
            </p>

            <h2>16. Menores de Idade</h2>
            <p>
              O Serviço não se destina a usuários menores de 18 anos. Não coletamos intencionalmente informações de menores.
            </p>

            <h2>17. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes Termos a qualquer momento. Alterações serão comunicadas via repositório GitHub do projeto. O uso continuado após alterações constitui aceitação.
            </p>

            <div className="mt-16 p-6 rounded-sm" style={{ backgroundColor: '#EEEAE4' }}>
              <p style={{ color: '#2A2824', fontWeight: 500, marginBottom: 0 }}>
                Ao usar a Resuna, você reconhece que leu, compreendeu e concorda em estar vinculado a estes Termos de Uso.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 py-10 mt-16"
        style={{ borderTop: '1px solid #E5E1DB' }}
      >
        <div className="max-w-6xl mx-auto px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
          <span
            className="text-[22px]"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              color: '#2A2824',
              letterSpacing: '-0.02em',
            }}
          >
            Resuna
          </span>
          <div className="flex gap-8">
            <Link
              href="/terms"
              className="text-[15px]"
              style={{ color: '#C46B48' }}
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacy"
              className="text-[15px] transition-colors duration-300"
              style={{ color: '#8A847A' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#C46B48'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#8A847A'}
            >
              Política de Privacidade
            </Link>
          </div>
          <span
            className="text-[13px]"
            style={{ color: '#A8A29E' }}
          >
            © 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
