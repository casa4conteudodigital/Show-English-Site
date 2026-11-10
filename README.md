# Show English — Next.js + Python

Versão base 0.2.0. Frontend em Next.js App Router/TypeScript; API independente em Python/FastAPI; Supabase para autenticação e autorização; LiveKit externo para áudio e vídeo.

## Executar a interface

Requer Node.js 22.13+ (recomendado 24 LTS) e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem credenciais, o site público e a demonstração do painel funcionam. O formulário de login fica desabilitado. Em `/colaboradores`, escolha **Explorar demonstração**. A prévia de câmera é local; não é uma videoconferência.

O frontend inclui cinco idiomas, modal de acessibilidade com preferências persistentes, FAQ React e navegação responsiva. Textos de vídeos e áudio permanecem no idioma original. Os horários comerciais continuam no fuso de São Paulo e os preços em reais.

## Executar a API Python

Python 3.12+; dependências verificadas neste ambiente com Python 3.14.

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.lock.txt
cp backend/.env.example backend/.env
cd backend
.venv/bin/uvicorn main:app --reload --port 8000
```

Documentação da API em http://localhost:8000/docs. Health check: `/health`.
`requirements.txt` registra dependências diretas; `requirements.lock.txt` fixa as versões verificadas. `package-lock.json` fixa o frontend.

## Ativar login e salas reais

1. Criar ou selecionar um projeto Supabase. Executar `backend/schema.sql` uma vez no SQL Editor. Ele cria perfis, salas, vínculos e políticas RLS.
2. No painel Auth, criar/convidar os colaboradores. Não há cadastro público na aplicação. Desabilitar signup público no Supabase, se não for utilizado por outro aplicativo.
3. Inserir o UUID do usuário em `profiles` com papel `teacher` ou `admin`; criar a sala em `rooms` e seu vínculo em `room_members`. Isso é uma operação administrativa. Inclusive administradores precisam de vínculo explícito.
4. Preencher `.env.local` com URL/chave pública do Supabase e URL pública da API Python. Reiniciar/recompilar o Next.js depois de alterar variáveis `NEXT_PUBLIC_*`.
5. Preencher `backend/.env` com URL/chave pública do Supabase e URL/chave/segredo do LiveKit. Definir `FRONTEND_ORIGINS` com as origens exatas autorizadas, separadas por vírgula. O backend usa o JWT do próprio usuário em consultas ao Supabase, preservando RLS; não precisa de service_role.
6. Hospedar LiveKit em infraestrutura externa apropriada para WebRTC, com domínio, TLS e portas/TURN configurados conforme documentação oficial. Não executar o servidor de mídia dentro de funções da Vercel.
7. Hospedar a API FastAPI em um serviço Python/ASGI (por exemplo, VPS) e o Next.js em hospedagem compatível. A API e a mídia podem compartilhar uma VPS se sua capacidade permitir. Não existe deploy automático neste repositório.
8. Em produção, frontend/API usam HTTPS e LiveKit usa WSS. Testar dois usuários autorizados em redes distintas, inclusive rede móvel, além de usuário sem vínculo. `getUserMedia` requer HTTPS, exceto localhost.

Os tokens têm validade de 10 minutos para entrada, identidade derivada da sessão validada e acesso a uma sala específica. Expirar o token **não encerra automaticamente uma chamada já conectada**. Remoção imediata de participantes e encerramento administrativo são evoluções futuras.

A API rejeita sessões ausentes/inválidas, usuários sem perfil de colaborador e salas não atribuídas/inativas. Não colocar `LIVEKIT_API_SECRET` nem credenciais privilegiadas em variáveis `NEXT_PUBLIC_*`.

Não foram fornecidas credenciais ou um servidor LiveKit, portanto login remoto, políticas no banco real e chamada entre participantes ainda precisam de validação de integração. Não há gravação, chat persistente, chamadas privadas ou aplicativo dos alunos nesta versão. As condições comerciais da hospedagem precisam ser adequadas antes da publicação.

## Validação

```bash
npm test
npm run typecheck
npm run build
backend/.venv/bin/python -m pytest backend/tests -q
```

Os testes Python substituem as respostas do Supabase para verificar as decisões de autorização e os grants do token; não substituem testes do banco com as políticas SQL aplicadas. O SDK de mídia oferece controles de câmera, microfone, saída, participantes e estado de conexão.

## Organização

- `app/`: rotas e estilos do Next.js.
- `components/`: cabeçalho, preferências, site público, painel e vídeo.
- `lib/messages.json`: dicionários em pt-BR/en/es/fr/it; fallback em português.
- `public/`: imagens e vídeos usados pela versão Next.js.
- `backend/`: API Python, esquema SQL e testes.
- `index.html`, `style/`, `javascript/`, `assets/` e `videos/`: originais preservados, não usados pelo Next.js. Não editar esses arquivos para modificar a versão atual.

## Backup e rollback

Veja [docs/ROLLBACK.md](docs/ROLLBACK.md). A migração está na branch `codex/next-python-migration`. O original está marcado por `backup/pre-next-2026-11-10`. Nenhuma alteração foi publicada remotamente.
