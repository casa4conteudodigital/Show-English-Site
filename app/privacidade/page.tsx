export default function PrivacyPage() {
  return (
    <main className="portal" id="conteudo">
      <article className="portal-container portal-card legal-copy">
        <h1>Política de privacidade</h1>
        <p>Versão 2026-11</p>
        <p>O Show English processa nome, e-mail, dados de conta, aceite dos termos e informações técnicas mínimas necessárias para autenticação, autorização e funcionamento das salas.</p>
        <p>Áudio e vídeo são transmitidos diretamente entre o navegador e o serviço LiveKit configurado. Esta versão não inicia gravações automaticamente. Dados de presença técnica podem ser recebidos por webhook para manter o estado das salas.</p>
        <p>As credenciais são armazenadas pelo Supabase Auth; a aplicação não cria nem mantém uma tabela própria de senhas. Solicitações de acesso ou exclusão podem ser encaminhadas à administração do Show English.</p>
      </article>
    </main>
  );
}
