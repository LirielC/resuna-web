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
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma Resuna Web ("Plataforma", "Serviço", "nós" ou "nosso"), você concorda em cumprir e estar vinculado a estes Termos de Uso ("Termos"). Se você não concordar com qualquer parte destes Termos, não deverá usar nosso Serviço.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              A Resuna Web é uma plataforma gratuita e open source que oferece:
            </p>
            <ul>
              <li>Ferramentas de criação e edição de currículos</li>
              <li>Análise de compatibilidade com sistemas ATS (Applicant Tracking System)</li>
              <li>Otimização de currículos usando tecnologia de Inteligência Artificial</li>
              <li>Geração de documentos (PDF, DOCX)</li>
              <li>Análise de compatibilidade com vagas de emprego</li>
              <li>Recursos de IA incluindo refinamento de currículo, geração de carta de apresentação e tradução de currículos</li>
            </ul>
            <p>
              <strong>Este é um projeto open source e todos os recursos são gratuitos.</strong> O código-fonte está disponível publicamente e pode ser usado de acordo com a licença do projeto.
            </p>

            <h2>3. Cadastro e Conta de Usuário</h2>

            <h3>3.1 Criação de Conta</h3>
            <ul>
              <li>Você deve fornecer informações precisas, completas e atualizadas durante o cadastro</li>
              <li>É sua responsabilidade manter a confidencialidade das credenciais da sua conta</li>
              <li>Você deve ter pelo menos 18 anos para usar este Serviço</li>
              <li>Uma pessoa ou entidade não pode manter mais de uma conta</li>
            </ul>

            <h3>3.2 Segurança da Conta</h3>
            <ul>
              <li>Você é responsável por todas as atividades que ocorram sob sua conta</li>
              <li>Você deve nos notificar imediatamente sobre qualquer uso não autorizado da sua conta</li>
              <li>Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos</li>
            </ul>

            <h2>4. Uso Aceitável</h2>

            <h3>4.1 Você Concorda em NÃO:</h3>
            <ul>
              <li>Violar quaisquer leis ou regulamentos aplicáveis</li>
              <li>Infringir os direitos de propriedade intelectual de terceiros</li>
              <li>Enviar código malicioso, vírus ou conteúdo prejudicial</li>
              <li>Tentar obter acesso não autorizado aos nossos sistemas</li>
              <li>Usar o Serviço para qualquer finalidade ilegal ou não autorizada</li>
              <li>Revender, redistribuir ou sublicenciar o Serviço</li>
              <li>Criar currículos falsos ou enganosos</li>
              <li>Usar sistemas automatizados (bots, scrapers) para acessar o Serviço</li>
              <li>Abusar, assediar ou prejudicar outros usuários</li>
            </ul>

            <h3>4.2 Padrões de Conteúdo</h3>
            <ul>
              <li>Você é o único responsável pelo conteúdo que cria e envia</li>
              <li>O conteúdo não deve conter informações falsas, fraudulentas ou enganosas</li>
              <li>Reservamo-nos o direito de remover conteúdo que viole estes Termos</li>
            </ul>

            <h2>5. Propriedade Intelectual</h2>

            <h3>5.1 Seu Conteúdo</h3>
            <ul>
              <li>Você mantém a propriedade de todo o conteúdo que cria usando o Serviço</li>
              <li>Você nos concede uma licença limitada para usar seu conteúdo exclusivamente para fornecer o Serviço</li>
              <li>Esta licença inclui o direito de armazenar, exibir e processar seu conteúdo</li>
            </ul>

            <h3>5.2 Código Open Source</h3>
            <ul>
              <li>O código-fonte da Resuna Web é open source e está disponível publicamente</li>
              <li>O uso, modificação e distribuição do código está sujeito à licença do projeto</li>
              <li>Você é livre para usar, modificar e distribuir o código conforme os termos da licença</li>
              <li>Nossas marcas e identidade visual não podem ser usadas sem permissão expressa por escrito</li>
            </ul>

            <h2>6. Conteúdo Gerado por IA</h2>

            <h3>6.1 Recursos de IA</h3>
            <ul>
              <li>Nossos recursos de IA utilizam a API Gemini do Google para fornecer sugestões e melhorias</li>
              <li>O conteúdo gerado por IA é fornecido "como está", sem garantias</li>
              <li>Você é responsável por revisar e verificar todo o conteúdo gerado por IA</li>
              <li>Não garantimos a precisão, completude ou qualidade do conteúdo gerado por IA</li>
            </ul>

            <h3>6.2 Sua Responsabilidade</h3>
            <ul>
              <li>Você deve revisar e editar o conteúdo gerado por IA antes de usá-lo</li>
              <li>Você é responsável por garantir a precisão e veracidade do conteúdo</li>
              <li>Não inclua experiências ou qualificações falsas no seu currículo</li>
            </ul>

            <h2>7. Serviços de Terceiros</h2>
            <p>
              Utilizamos serviços de terceiros incluindo:
            </p>
            <ul>
              <li><strong>Firebase/Google Cloud:</strong> Autenticação, armazenamento de dados e hospedagem</li>
              <li><strong>Vercel:</strong> Hospedagem da aplicação</li>
              <li><strong>Google Gemini API:</strong> Recursos de IA</li>
            </ul>
            <p>
              O uso desses serviços está sujeito aos respectivos termos de serviço e políticas de privacidade.
            </p>

            <h2>8. Privacidade e Proteção de Dados</h2>
            <p>
              Sua privacidade é importante para nós. Nossa coleta e uso de informações pessoais estão descritos em nossa <Link href="/privacy">Política de Privacidade</Link>, que é incorporada a estes Termos por referência.
            </p>

            <h2>9. Recursos de Compartilhamento Público</h2>

            <h3>9.1 Links de Compartilhamento</h3>
            <ul>
              <li>Você pode gerar links públicos para compartilhar seu currículo</li>
              <li>Links de compartilhamento expiram após 7 dias por padrão</li>
              <li>Você pode revogar links de compartilhamento a qualquer momento</li>
              <li>Currículos compartilhados são acessíveis publicamente por qualquer pessoa com o link</li>
            </ul>

            <h3>9.2 Responsabilidade</h3>
            <ul>
              <li>Você é responsável por controlar quem tem acesso aos seus links de compartilhamento</li>
              <li>Não somos responsáveis por acesso não autorizado a conteúdo compartilhado publicamente</li>
            </ul>

            <h2>10. Disponibilidade do Serviço</h2>

            <h3>10.1 Tempo de Atividade</h3>
            <ul>
              <li>Nos esforçamos para manter 99,9% de disponibilidade, mas não garantimos serviço ininterrupto</li>
              <li>Podemos suspender o Serviço para manutenção, atualizações ou emergências</li>
            </ul>

            <h3>10.2 Alterações no Serviço</h3>
            <ul>
              <li>Reservamo-nos o direito de modificar ou descontinuar recursos a qualquer momento</li>
              <li>Forneceremos aviso razoável de alterações significativas</li>
              <li>O uso continuado após alterações constitui aceitação</li>
            </ul>

            <h2>11. Limitação de Responsabilidade</h2>

            <h3>11.1 Sem Garantias</h3>
            <p>
              O SERVIÇO É FORNECIDO "COMO ESTÁ", SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO A GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM PROPÓSITO ESPECÍFICO OU NÃO VIOLAÇÃO.
            </p>

            <h3>11.2 Limitação de Responsabilidade</h3>
            <p>
              NA MÁXIMA EXTENSÃO PERMITIDA PELA LEI, COMO ESTE É UM SERVIÇO GRATUITO, NÃO TEMOS RESPONSABILIDADE FINANCEIRA POR DANOS DIRETOS OU INDIRETOS DECORRENTES DO USO DO SERVIÇO.
            </p>

            <h3>11.3 Exclusões</h3>
            <p>
              NÃO SOMOS RESPONSÁVEIS POR:
            </p>
            <ul>
              <li>Lucros cessantes, dados ou oportunidades de negócios</li>
              <li>Danos indiretos, incidentais ou consequenciais</li>
              <li>Danos resultantes do seu uso ou incapacidade de usar o Serviço</li>
              <li>Ações ou conteúdo de terceiros</li>
              <li>Resultados de emprego ou candidaturas a vagas</li>
            </ul>

            <h2>12. Indenização</h2>
            <p>
              Você concorda em indenizar e isentar-nos de quaisquer reclamações, danos, perdas ou despesas (incluindo honorários advocatícios) decorrentes de:
            </p>
            <ul>
              <li>Seu uso do Serviço</li>
              <li>Sua violação destes Termos</li>
              <li>Sua violação de direitos de terceiros</li>
              <li>Conteúdo que você cria ou envia</li>
            </ul>

            <h2>13. Lei Aplicável e Resolução de Disputas</h2>

            <h3>13.1 Lei Aplicável</h3>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil, sem considerar conflitos de princípios legais.
            </p>

            <h3>13.2 Foro</h3>
            <p>
              Quaisquer disputas decorrentes destes Termos serão resolvidas no foro da comarca de [Sua Cidade], com exclusão de qualquer outro, por mais privilegiado que seja.
            </p>

            <h2>14. Rescisão</h2>

            <h3>14.1 Por Você</h3>
            <p>
              Você pode encerrar sua conta a qualquer momento através das configurações da conta.
            </p>

            <h3>14.2 Por Nós</h3>
            <p>
              Podemos suspender ou encerrar sua conta se:
            </p>
            <ul>
              <li>Você violar estes Termos</li>
              <li>Você se envolver em atividades fraudulentas ou ilegais</li>
              <li>Sua conta permanecer inativa por um período prolongado</li>
              <li>Exigido por lei</li>
            </ul>

            <h3>14.3 Efeitos da Rescisão</h3>
            <p>
              Após a rescisão:
            </p>
            <ul>
              <li>Seu acesso ao Serviço cessará imediatamente</li>
              <li>Você poderá exportar seus dados dentro de 30 dias</li>
              <li>Podemos excluir seus dados após 90 dias</li>
            </ul>

            <h2>15. Retenção e Exclusão de Dados</h2>
            <ul>
              <li>Você pode exportar seus dados a qualquer momento em formato JSON</li>
              <li>Você pode solicitar a exclusão da conta através das configurações da conta</li>
              <li>Após a exclusão, seus dados serão permanentemente removidos dentro de 90 dias</li>
              <li>Alguns dados podem ser retidos por motivos legais ou de conformidade</li>
            </ul>

            <h2>16. Lei Geral de Proteção de Dados (LGPD)</h2>
            <p>
              Em conformidade com a LGPD (Lei nº 13.709/2018), você possui os seguintes direitos:
            </p>
            <ul>
              <li>Direito de acessar, retificar ou excluir seus dados pessoais</li>
              <li>Direito à portabilidade de dados</li>
              <li>Direito de se opor ao processamento</li>
              <li>Direito de revogar o consentimento</li>
              <li>Direito de apresentar reclamações à Autoridade Nacional de Proteção de Dados (ANPD)</li>
            </ul>
            <p>
              Consulte nossa <Link href="/privacy">Política de Privacidade</Link> para informações completas sobre o processamento de dados.
            </p>

            <h2>17. Menores de Idade</h2>
            <p>
              O Serviço não se destina a usuários menores de 18 anos. Não coletamos intencionalmente informações de menores. Se descobrirmos que coletamos informações de um menor, as excluiremos imediatamente.
            </p>

            <h2>18. Informações de Contato</h2>
            <p>
              Para questões sobre estes Termos, entre em contato conosco:
            </p>
            <ul>
              <li><strong>E-mail:</strong> suporte@resuna.app</li>
              <li><strong>Endereço:</strong> [Seu endereço comercial]</li>
            </ul>

            <h2>19. Disposições Gerais</h2>

            <h3>19.1 Independência das Cláusulas</h3>
            <p>
              Se qualquer disposição destes Termos for considerada inexequível, as disposições restantes continuarão em pleno vigor e efeito.
            </p>

            <h3>19.2 Acordo Integral</h3>
            <p>
              Estes Termos constituem o acordo integral entre você e a Resuna Web em relação ao Serviço e substituem todos os acordos anteriores.
            </p>

            <h3>19.3 Alterações nos Termos</h3>
            <p>
              Podemos atualizar estes Termos a qualquer momento. Notificaremos os usuários sobre alterações materiais através de:
            </p>
            <ul>
              <li>Notificação por e-mail</li>
              <li>Notificação no aplicativo</li>
              <li>Aviso em nosso site</li>
            </ul>
            <p>
              O uso continuado após as alterações constitui aceitação. Se você discordar das alterações, deve parar de usar o Serviço.
            </p>

            <div className="mt-16 p-6 rounded-sm" style={{ backgroundColor: '#EEEAE4' }}>
              <p style={{ color: '#2A2824', fontWeight: 500, marginBottom: 0 }}>
                Ao usar a Resuna Web, você reconhece que leu, compreendeu e concorda em estar vinculado a estes Termos de Uso.
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
