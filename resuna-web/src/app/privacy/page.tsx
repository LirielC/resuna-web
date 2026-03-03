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
          Última atualização: 23 de fevereiro de 2026
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
              A Resuna Web ("nós", "nosso" ou "Plataforma") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e compartilhamos suas informações pessoais quando você usa nossa plataforma.
            </p>
            <p>
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e outras legislações aplicáveis de proteção de dados.
            </p>
            <p>
              <strong>A Resuna Web é um projeto gratuito e open source.</strong> Não cobramos pelos nossos serviços e o código-fonte está disponível publicamente.
            </p>

            <h2>2. Informações que Coletamos</h2>

            <h3>2.1 Informações Fornecidas por Você</h3>
            <p>
              Coletamos as seguintes informações quando você cria uma conta e usa nossos serviços:
            </p>
            <ul>
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha (criptografada)</li>
              <li><strong>Dados Profissionais:</strong> Informações do currículo incluindo experiências profissionais, educação, habilidades, certificações, idiomas</li>
              <li><strong>Dados de Perfil:</strong> Foto (opcional), telefone, localização, links de LinkedIn e portfólio</li>
              <li><strong>Conteúdo Criado:</strong> Currículos, descrições de vagas, cartas de apresentação</li>
              <li><strong>Comunicações:</strong> Mensagens enviadas para nosso suporte</li>
            </ul>

            <h3>2.2 Informações Coletadas Automaticamente</h3>
            <ul>
              <li><strong>Dados de Uso:</strong> Páginas visitadas, recursos utilizados, tempo de sessão</li>
              <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional, identificador de dispositivo</li>
              <li><strong>Cookies e Tecnologias Similares:</strong> Usamos cookies para melhorar sua experiência (veja seção 8)</li>
              <li><strong>Logs de Acesso:</strong> Data, hora e atividades realizadas na plataforma</li>
            </ul>


            <h2>3. Como Usamos Suas Informações</h2>

            <h3>3.1 Finalidades do Tratamento</h3>
            <p>
              Usamos suas informações pessoais para:
            </p>
            <ul>
              <li><strong>Prestação do Serviço:</strong> Criar, armazenar e gerenciar seus currículos</li>
              <li><strong>Análise ATS:</strong> Processar análises de compatibilidade com vagas</li>
              <li><strong>Recursos de IA:</strong> Fornecer refinamento, tradução e geração de cartas usando IA</li>
              <li><strong>Autenticação:</strong> Verificar sua identidade e gerenciar seu acesso</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre sua conta, atualizações e novidades</li>
              <li><strong>Suporte:</strong> Responder suas dúvidas e solucionar problemas</li>
              <li><strong>Melhoria do Serviço:</strong> Analisar uso para melhorar funcionalidades</li>
              <li><strong>Segurança:</strong> Detectar e prevenir fraudes e abusos</li>
              <li><strong>Conformidade Legal:</strong> Cumprir obrigações legais e regulatórias</li>
            </ul>

            <h3>3.2 Base Legal (LGPD)</h3>
            <p>
              Processamos seus dados pessoais com base em:
            </p>
            <ul>
              <li><strong>Execução de Contrato:</strong> Para fornecer os serviços que você contratou</li>
              <li><strong>Consentimento:</strong> Para recursos opcionais que requerem sua autorização</li>
              <li><strong>Legítimo Interesse:</strong> Para melhorar nossos serviços e prevenir fraudes</li>
              <li><strong>Obrigação Legal:</strong> Para cumprir exigências legais e regulatórias</li>
            </ul>

            <h2>4. Compartilhamento de Informações</h2>

            <h3>4.1 Com Quem Compartilhamos</h3>
            <p>
              Podemos compartilhar suas informações com:
            </p>
            <ul>
              <li><strong>Provedores de Serviço:</strong>
                <ul>
                  <li><strong>Firebase/Google Cloud:</strong> Hospedagem, autenticação e armazenamento</li>
                  <li><strong>Vercel:</strong> Hospedagem da aplicação web</li>
                  <li><strong>Google Gemini API:</strong> Serviços de IA</li>
                </ul>
              </li>
              <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou para proteger direitos</li>
              <li><strong>Compartilhamento Público:</strong> Quando você gera links públicos para compartilhar seu currículo</li>
            </ul>

            <h3>4.2 O Que NÃO Fazemos</h3>
            <ul>
              <li>❌ Não vendemos seus dados pessoais para terceiros</li>
              <li>❌ Não compartilhamos seus currículos sem sua autorização</li>
              <li>❌ Não usamos seus dados para publicidade direcionada de terceiros</li>
            </ul>

            <h2>5. Armazenamento e Segurança</h2>

            <h3>5.1 Onde Armazenamos</h3>
            <ul>
              <li>Seus dados são armazenados em servidores do <strong>Google Cloud</strong></li>
              <li>Os servidores estão localizados no Brasil e/ou em regiões geograficamente próximas</li>
              <li>Utilizamos o <strong>Firestore</strong> (banco de dados NoSQL) e <strong>Cloud Storage</strong></li>
            </ul>

            <h3>5.2 Medidas de Segurança</h3>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul>
              <li><strong>Criptografia:</strong> Conexões HTTPS (TLS/SSL) e senhas criptografadas</li>
              <li><strong>Autenticação:</strong> Firebase Authentication com múltiplos fatores</li>
              <li><strong>Controle de Acesso:</strong> Firestore Security Rules restringem acesso aos dados</li>
              <li><strong>Monitoramento:</strong> Logs e alertas para atividades suspeitas</li>
              <li><strong>Cookies Seguros:</strong> Cookies httpOnly e secure</li>
              <li><strong>Backups:</strong> Backups regulares para prevenir perda de dados</li>
            </ul>

            <h3>5.3 Retenção de Dados</h3>
            <ul>
              <li><strong>Conta Ativa:</strong> Mantemos seus dados enquanto sua conta estiver ativa</li>
              <li><strong>Após Exclusão:</strong> Dados são permanentemente excluídos em até 90 dias</li>
              <li><strong>Obrigações Legais:</strong> Alguns dados podem ser retidos por períodos exigidos por lei</li>
              <li><strong>Logs de Sistema:</strong> Logs anonimizados podem ser mantidos para segurança e auditoria</li>
            </ul>

            <h2>6. Seus Direitos (LGPD)</h2>

            <h3>6.1 Direitos do Titular dos Dados</h3>
            <p>
              Conforme a LGPD, você tem os seguintes direitos:
            </p>
            <ul>
              <li><strong>Acesso:</strong> Confirmar se tratamos seus dados e acessá-los</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar a eliminação de dados tratados com seu consentimento</li>
              <li><strong>Portabilidade:</strong> Exportar seus dados em formato estruturado (JSON)</li>
              <li><strong>Revogação de Consentimento:</strong> Retirar consentimento para tratamentos específicos</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas situações</li>
              <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
              <li><strong>Anonimização/Bloqueio:</strong> Solicitar anonimização ou bloqueio de dados</li>
            </ul>

            <h3>6.2 Como Exercer Seus Direitos</h3>
            <p>
              Você pode exercer seus direitos através de:
            </p>
            <ul>
              <li><strong>Configurações da Conta:</strong> Editar, exportar ou excluir dados diretamente</li>
              <li><strong>E-mail:</strong> Entre em contato conosco em privacidade@resuna.app</li>
              <li><strong>Prazo de Resposta:</strong> Responderemos solicitações em até 15 dias</li>
            </ul>

            <h3>6.3 Encarregado de Dados (DPO)</h3>
            <p>
              Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado em:
            </p>
            <ul>
              <li><strong>E-mail:</strong> dpo@resuna.app</li>
              <li><strong>Responsável:</strong> [Nome do DPO]</li>
            </ul>

            <h2>7. Transferência Internacional de Dados</h2>
            <p>
              Alguns de nossos provedores de serviço podem estar localizados fora do Brasil:
            </p>
            <ul>
              <li><strong>Google Cloud/Firebase:</strong> Pode processar dados em servidores internacionais</li>
              <li><strong>Garantias:</strong> Utilizamos cláusulas contratuais padrão e outros mecanismos de conformidade</li>
              <li><strong>Proteção:</strong> Garantimos que o nível de proteção de dados seja equivalente ao da LGPD</li>
            </ul>

            <h2>8. Cookies e Tecnologias de Rastreamento</h2>

            <h3>8.1 O Que São Cookies</h3>
            <p>
              Cookies são pequenos arquivos de texto armazenados no seu navegador para melhorar sua experiência.
            </p>

            <h3>8.2 Tipos de Cookies que Usamos</h3>
            <ul>
              <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site (autenticação, sessão)</li>
              <li><strong>Cookies de Desempenho:</strong> Ajudam a entender como você usa o site</li>
              <li><strong>Cookies Funcionais:</strong> Lembram suas preferências (idioma, tema)</li>
            </ul>

            <h3>8.3 Gerenciamento de Cookies</h3>
            <ul>
              <li>Você pode aceitar ou recusar cookies através do banner de consentimento</li>
              <li>Você pode desabilitar cookies nas configurações do seu navegador</li>
              <li>Note que desabilitar cookies pode afetar funcionalidades do site</li>
            </ul>

            <h2>9. Links para Sites de Terceiros</h2>
            <p>
              Nossa plataforma pode conter links para sites de terceiros (LinkedIn, portfólios, etc.). Não somos responsáveis pelas práticas de privacidade desses sites. Recomendamos que você leia as políticas de privacidade de cada site que visitar.
            </p>

            <h2>10. Menores de Idade</h2>
            <p>
              Nosso serviço não se destina a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se você é pai ou responsável e descobrir que seu filho nos forneceu dados, entre em contato conosco para que possamos excluir essas informações.
            </p>

            <h2>11. Recursos de IA e Conteúdo Gerado</h2>

            <h3>11.1 Uso de IA</h3>
            <p>
              Utilizamos a <strong>API Gemini do Google</strong> para:
            </p>
            <ul>
              <li>Refinar e otimizar currículos</li>
              <li>Gerar cartas de apresentação</li>
              <li>Traduzir currículos para outros idiomas</li>
            </ul>

            <h3>11.2 Processamento de Dados</h3>
            <ul>
              <li>Enviamos apenas o conteúdo necessário (currículo, descrição da vaga) para a API Gemini</li>
              <li>Google processa dados conforme suas próprias políticas de privacidade</li>
              <li>Conteúdo gerado por IA é de sua propriedade e responsabilidade</li>
              <li>Recomendamos sempre revisar e validar conteúdo gerado por IA</li>
            </ul>

            <h2>12. Compartilhamento Público de Currículos</h2>
            <p>
              Quando você gera um link público para compartilhar seu currículo:
            </p>
            <ul>
              <li>O currículo se torna acessível a qualquer pessoa com o link</li>
              <li>Links expiram automaticamente após 7 dias (padrão)</li>
              <li>Você pode revogar links a qualquer momento</li>
              <li>Rastreamos número de visualizações para sua informação</li>
              <li>Você é responsável por controlar quem tem acesso ao link</li>
            </ul>

            <h2>13. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações significativas, notificaremos você através de:
            </p>
            <ul>
              <li>E-mail para o endereço cadastrado</li>
              <li>Notificação destacada em nossa plataforma</li>
              <li>Aviso na página inicial do site</li>
            </ul>
            <p>
              A data da "Última atualização" no topo desta página indica quando a política foi revisada pela última vez.
            </p>

            <h2>14. Conformidade e Reclamações</h2>

            <h3>14.1 Autoridade Nacional de Proteção de Dados (ANPD)</h3>
            <p>
              Você tem o direito de apresentar reclamações sobre o tratamento de seus dados à ANPD:
            </p>
            <ul>
              <li><strong>Website:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></li>
              <li><strong>E-mail:</strong> contato@anpd.gov.br</li>
            </ul>

            <h3>14.2 Nosso Compromisso</h3>
            <p>
              Estamos comprometidos em resolver quaisquer preocupações sobre privacidade. Entre em contato conosco primeiro para que possamos abordar suas questões diretamente.
            </p>

            <h2>15. Contato</h2>
            <p>
              Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato:
            </p>
            <ul>
              <li><strong>E-mail Geral:</strong> privacidade@resuna.app</li>
              <li><strong>Encarregado (DPO):</strong> dpo@resuna.app</li>
              <li><strong>Suporte:</strong> suporte@resuna.app</li>
              <li><strong>Endereço:</strong> [Seu endereço comercial completo]</li>
            </ul>

            <h2>16. Glossário</h2>
            <ul>
              <li><strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais</li>
              <li><strong>Tratamento:</strong> Toda operação realizada com dados pessoais</li>
              <li><strong>Controlador:</strong> A Resuna Web, que toma decisões sobre o tratamento</li>
              <li><strong>Operador:</strong> Quem realiza o tratamento em nome do controlador</li>
              <li><strong>Encarregado (DPO):</strong> Pessoa indicada para atuar como canal de comunicação</li>
              <li><strong>LGPD:</strong> Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</li>
              <li><strong>ANPD:</strong> Autoridade Nacional de Proteção de Dados</li>
            </ul>

            <div className="mt-16 p-6 rounded-sm" style={{ backgroundColor: '#EEEAE4' }}>
              <p style={{ color: '#2A2824', fontWeight: 500, marginBottom: '0.75rem' }}>
                Transparência e Controle
              </p>
              <p style={{ color: '#5C5850', marginBottom: 0 }}>
                Você tem controle total sobre seus dados. Pode visualizar, editar, exportar ou excluir suas informações a qualquer momento através das configurações da sua conta. Estamos comprometidos em proteger sua privacidade e cumprir integralmente com a LGPD.
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
