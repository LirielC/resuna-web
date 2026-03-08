'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
          Política de Privacidade
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
            <h2>1. Introdução</h2>
            <p>
              A Resuna é um projeto <strong>gratuito e open source</strong> de criação e otimização de currículos. Esta Política descreve de forma transparente quais dados coletamos, como os usamos e quais são seus direitos.
            </p>
            <p>
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>

            <h2>2. Princípio: Local-First</h2>
            <p>
              O conteúdo dos seus currículos e cartas de apresentação <strong>não é enviado nem armazenado em nossos servidores</strong>. Esses dados ficam exclusivamente no <strong>localStorage do seu navegador</strong>, no seu dispositivo.
            </p>
            <p>
              Isso significa que nenhum colaborador do projeto, operador de servidor ou terceiro tem acesso ao conteúdo dos seus currículos — a menos que você o envie explicitamente para os recursos de IA.
            </p>

            <h2>3. O Que Coletamos</h2>

            <h3>3.1 Dados de Autenticação</h3>
            <p>
              O cadastro e login são feitos <strong>exclusivamente via Google OAuth</strong> (Firebase Authentication). Não existe autenticação por e-mail e senha. Ao fazer login, recebemos do Google:
            </p>
            <ul>
              <li>Nome de exibição</li>
              <li>Endereço de e-mail</li>
              <li>URL da foto de perfil (opcional)</li>
              <li>Identificador único (UID) do Google</li>
            </ul>
            <p>
              Essas informações são gerenciadas pelo Firebase Authentication e não são armazenadas de forma redundante por nós.
            </p>

            <h3>3.2 Dados de Uso e Telemetria</h3>
            <p>
              Para fins de segurança, prevenção de abuso e entendimento agregado do uso do serviço, registramos no servidor:
            </p>
            <ul>
              <li><strong>Tipo de ação:</strong> ex. <em>CREATE_RESUME</em>, <em>ATS_ANALYSIS</em>, <em>EXPORT_PDF</em> — sem o conteúdo associado</li>
              <li><strong>IP hasheado:</strong> o endereço IP é convertido em hash SHA-256 (truncado a 16 caracteres) antes de ser armazenado — o IP real nunca é salvo</li>
              <li><strong>User-agent anonimizado:</strong> registramos apenas a categoria (ex. "Chrome/Windows"), sem detalhes identificáveis do dispositivo</li>
              <li><strong>Timestamp:</strong> data e hora da ação</li>
            </ul>
            <p>
              <strong>Não registramos:</strong> conteúdo de currículos, descrições de vagas, resultados de IA, e-mail do usuário nos logs de atividade, nem o IP completo.
            </p>

            <h3>3.3 Resultados de Análise ATS</h3>
            <p>
              Quando você usa a análise de compatibilidade ATS, o conteúdo do currículo é enviado ao nosso servidor Python (FastAPI) para processamento local. Os <strong>resultados</strong> (pontuação, palavras-chave, recomendações) são armazenados no Firestore associados ao seu UID para que você possa consultá-los posteriormente.
            </p>

            <h3>3.4 Dados Não Coletados</h3>
            <ul>
              <li>❌ Conteúdo dos seus currículos (armazenado apenas no seu navegador)</li>
              <li>❌ Histórico de navegação ou comportamento fora do app</li>
              <li>❌ Cookies de rastreamento ou publicidade</li>
              <li>❌ Dados financeiros ou de pagamento (não há cobrança)</li>
              <li>❌ Endereço IP completo (apenas hash truncado)</li>
            </ul>

            <h2>4. Como Usamos Suas Informações</h2>
            <ul>
              <li><strong>Autenticação:</strong> identificar você e controlar o acesso à conta</li>
              <li><strong>Análise ATS:</strong> processar e armazenar os resultados das suas análises</li>
              <li><strong>Limites de uso:</strong> aplicar rate limiting e CAPTCHA para prevenir abuso</li>
              <li><strong>Segurança:</strong> detectar padrões anômalos usando os logs anonimizados</li>
              <li><strong>Melhorias:</strong> entender em nível agregado quais funcionalidades são mais usadas</li>
            </ul>

            <h2>5. Recursos de IA e Serviços de Terceiros</h2>

            <h3>5.1 OpenRouter API</h3>
            <p>
              Os recursos de IA (refinamento de currículo, geração de carta de apresentação, tradução) enviam o conteúdo necessário — texto do currículo e/ou descrição da vaga — para a <strong>API OpenRouter</strong>, que roteia a requisição para modelos de linguagem abertos de múltiplos provedores. O processamento ocorre nos servidores da OpenRouter conforme seus próprios termos e política de privacidade.
            </p>
            <p>
              Não enviamos seu e-mail, nome ou qualquer dado de identificação junto com as requisições de IA.
            </p>

            <h3>5.2 Firebase / Google Cloud</h3>
            <p>
              Utilizamos o Firebase para autenticação e o Firestore para armazenar dados operacionais (resultados ATS, logs de uso anonimizados, perfil de conta). Os dados são processados pela Google conforme a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade do Google</a>.
            </p>

            <h3>5.3 Cloudflare Turnstile</h3>
            <p>
              Usamos o Cloudflare Turnstile como CAPTCHA em operações sensíveis (análise ATS, exportação). O Turnstile analisa sinais do navegador sem rastrear o usuário individualmente. Veja a <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">política da Cloudflare</a>.
            </p>

            <h2>6. O Que NÃO Fazemos</h2>
            <ul>
              <li>❌ Não vendemos seus dados pessoais</li>
              <li>❌ Não compartilhamos dados com anunciantes</li>
              <li>❌ Não usamos seus dados para treinar modelos de IA</li>
              <li>❌ Não enviamos e-mails de marketing ou newsletters</li>
              <li>❌ Não acessamos o conteúdo dos seus currículos (ficam no seu navegador)</li>
            </ul>

            <h2>7. Armazenamento e Segurança</h2>

            <h3>7.1 Dados no Servidor</h3>
            <ul>
              <li>Armazenados no <strong>Google Cloud Firestore</strong> (Brasil e/ou regiões próximas)</li>
              <li>Acesso controlado por Firebase Security Rules — cada usuário acessa apenas seus próprios dados</li>
              <li>Comunicação exclusivamente via HTTPS (TLS)</li>
            </ul>

            <h3>7.2 Dados no Seu Dispositivo</h3>
            <ul>
              <li>Currículos e cartas ficam no <strong>localStorage</strong> do seu navegador</li>
              <li>Você tem controle total: pode exportar (JSON) ou excluir a qualquer momento pelo app</li>
              <li>Limpar os dados do navegador apaga seus currículos permanentemente</li>
            </ul>

            <h3>7.3 Retenção</h3>
            <ul>
              <li><strong>Conta ativa:</strong> dados de autenticação e resultados ATS mantidos enquanto a conta existir</li>
              <li><strong>Após exclusão da conta:</strong> dados do Firestore removidos em até 90 dias</li>
              <li><strong>Logs anonimizados:</strong> podem ser mantidos por período superior para fins de segurança e auditoria, pois não contêm dados pessoais identificáveis</li>
            </ul>

            <h2>8. Armazenamento Local (localStorage)</h2>
            <p>
              O app utiliza o localStorage do navegador — não cookies — para armazenar seus currículos e cartas de apresentação. O localStorage não é transmitido ao servidor automaticamente e não é acessível por outros sites.
            </p>
            <p>
              Você pode exportar seus dados a qualquer momento em formato JSON pelo aplicativo.
            </p>

            <h2>9. Seus Direitos (LGPD)</h2>

            <h3>9.1 Direitos do Titular</h3>
            <ul>
              <li><strong>Acesso:</strong> consultar dados que mantemos sobre você</li>
              <li><strong>Correção:</strong> corrigir dados incompletos ou inexatos</li>
              <li><strong>Exclusão:</strong> excluir sua conta e dados associados via <Link href="/account">Minha Conta</Link></li>
              <li><strong>Portabilidade:</strong> exportar seus currículos em JSON a qualquer momento</li>
              <li><strong>Oposição:</strong> opor-se a tratamentos específicos</li>
              <li><strong>Reclamação à ANPD:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></li>
            </ul>

            <h3>9.2 Como Exercer</h3>
            <p>
              A maioria dos direitos pode ser exercida diretamente pelo app (exportar, excluir conta). Para solicitações adicionais, abra uma issue no repositório GitHub do projeto.
            </p>

            <h2>10. Transferência Internacional de Dados</h2>
            <p>
              Ao usar recursos de IA, o conteúdo do currículo pode ser processado fora do Brasil pela OpenRouter e seus provedores de modelos. Ao usar o Firebase, dados podem transitar por servidores Google internacionais. Ambos os provedores adotam mecanismos de proteção equivalentes à LGPD.
            </p>

            <h2>11. Menores de Idade</h2>
            <p>
              O Serviço não se destina a menores de 18 anos. Se identificarmos que dados de um menor foram coletados inadvertidamente, os excluiremos imediatamente.
            </p>

            <h2>12. Alterações nesta Política</h2>
            <p>
              Atualizações serão publicadas nesta página e comunicadas via repositório GitHub. A data no topo indica a última revisão.
            </p>

            <h2>13. Contato</h2>
            <p>
              Por ser um projeto open source, dúvidas e solicitações relacionadas à privacidade devem ser feitas via <strong>GitHub Issues</strong> no repositório do projeto.
            </p>

            <div className="mt-16 p-6 rounded-sm" style={{ backgroundColor: '#EEEAE4' }}>
              <p style={{ color: '#2A2824', fontWeight: 500, marginBottom: '0.75rem' }}>
                Transparência e Controle
              </p>
              <p style={{ color: '#5C5850', marginBottom: 0 }}>
                O design local-first da Resuna foi uma escolha deliberada de privacidade: seu currículo é seu, fica no seu dispositivo e não passa pelos nossos servidores. Você pode exportar, excluir e migrar seus dados a qualquer momento, sem depender de nós.
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
              className="text-[15px] transition-colors duration-300"
              style={{ color: '#8A847A' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#C46B48'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#8A847A'}
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacy"
              className="text-[15px]"
              style={{ color: '#C46B48' }}
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
