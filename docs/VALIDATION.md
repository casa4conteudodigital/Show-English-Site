# Verificação da versão base — 10/11/2026

- Backup: SHA-256 conferido; 22 arquivos do arquivo tar comparados com os originais, sem diferenças.
- Next.js: build de produção passou, incluindo compilação TypeScript e quatro rotas da aplicação.
- Traduções: testes de paridade entre cinco idiomas, campos do FAQ e chaves literais da interface passaram.
- Python: seis testes passaram para ausência de sessão, sessão inválida, usuário sem perfil, sala não autorizada, UUID inválido e token com identidade/permissões definidas no servidor. Respostas Supabase simuladas. O TestClient gera um aviso de depreciação sobre httpx na versão instalada; não houve falha.
- Navegador local: modal, Escape/retorno de foco, alto contraste, texto ampliado, restauração de preferências, francês persistente entre páginas, login desabilitado sem configuração, painel demonstrativo e sala demonstrativa conferidos.
- Layout móvel: menu abre/fecha e largura do documento igual à largura disponível (375 px dentro da viewport configurada de 390 px com barra de rolagem).
- Console: nenhum erro capturado ao final da verificação.

A navegação client-side aguardou compilação de rotas no servidor de desenvolvimento; a chegada às páginas foi confirmada. O teste Python precisou ser executado fora da sandbox porque a comunicação entre threads do TestClient ficou bloqueada dentro dela.

Não testados: autenticação remota real, aplicação das políticas no Supabase real, captura física de câmera/microfone, chamada LiveKit entre participantes, TURN/redes móveis e carga. Dependem de ambiente/credenciais e dispositivos. Nenhuma gravação foi iniciada. Não houve publicação nem push remoto.
