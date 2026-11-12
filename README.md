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

## Instalação de Auth e salas

Stack: Next.js 16/React 19, API FastAPI já existente, Supabase PostgreSQL/Auth e LiveKit Cloud. O vídeo/áudio vai direto do navegador ao LiveKit; Render hospeda apenas HTTP. Não há servidor LiveKit no Render.

### Supabase

1. Para um projeto novo, cole `backend/schema.sql` no SQL Editor. Para uma instalação que já executou o schema anterior, aplique `backend/migrations/001_auth_classrooms.sql`. A migração incremental preserva perfis, papéis antigos, salas e vínculos; ela copia os papéis para `user_roles` e as salas antigas para `classrooms`.
2. Confira a aplicação com `select version, applied_at from public.schema_migrations order by applied_at;`. A migração é idempotente, mas mantenha uma cópia do banco antes de aplicá-la em produção.
3. Em Authentication > URL Configuration, configure Site URL como a origem publicada e inclua `http://localhost:3000/auth/callback`, `http://localhost:3000/redefinir-senha` e as rotas equivalentes no domínio de produção. Use apenas origens/destinos controlados por você.
4. Em Authentication > Providers > Email, mantenha confirmação de e-mail ligada. Configure um provedor SMTP próprio para produção, valide domínio/DNS (SPF, DKIM e DMARC) e revise os limites de envio/rate limits no painel. O SMTP de teste do Supabase não é adequado para entrega pública; respeite o intervalo de reenvio mostrado pelo projeto.
5. Configure os templates de confirmação e recuperação para direcionar ao callback da aplicação (o cliente solicita `/auth/callback` como redirect). O callback verifica o token/código, restaura a sessão e só aceita caminhos internos seguros.
6. Para promover a conta do demonstrador, crie a conta pelo site, confirme o e-mail e copie o UUID em Authentication > Users. Execute no SQL Editor, substituindo o UUID: `insert into public.user_roles(user_id, role) values ('UUID-DO-USUARIO', 'teacher') on conflict (user_id, role) do nothing;`. Não use `user_metadata` para conceder permissões; somente SQL/admin confiável promove para professor/admin.

Para criar a primeira conta administradora, crie/convide a conta confiável, confirme o e-mail, copie seu UUID em Authentication > Users e execute no SQL Editor:

```sql
insert into public.user_roles(user_id, role)
values ('UUID-DO-ADMINISTRADOR', 'admin')
on conflict (user_id, role) do nothing;
```

Essa conta pode abrir `/colaboradores/administracao` e convidar professores pelo nome e e-mail. O backend usa `SUPABASE_SERVICE_ROLE_KEY` para enviar o convite e conceder `teacher`; essa chave nunca é enviada ao navegador. O convidado define sua própria senha em `/redefinir-senha` e segue para o painel. Em Authentication > URL Configuration, mantenha a URL pública `/redefinir-senha` na lista de Redirect URLs. Cadastros públicos continuam recebendo somente o papel `student`.

O cadastro público cria apenas perfil e papel `student`; não há tabela própria de senhas. Professores criam salas no painel. Para uma aula de demonstração aberta a usuários autenticados, escolha `authenticated_demo`; uma sala `members_only` exige associação prévia em `classroom_members` e o link sozinho não concede acesso. A tela nunca trata confirmação pendente como login concluído.

### Ambiente local

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Preencha no frontend `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_API_URL`. No backend configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `APP_BASE_URL` e `ALLOWED_ORIGINS`. `SUPABASE_SERVICE_ROLE_KEY` é usada somente para persistir eventos webhook; nunca a coloque numa variável `NEXT_PUBLIC_*`. O nome LiveKit é opaco e nenhum token Supabase é reutilizado como token LiveKit.

Inicie `backend/.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000` e, em outro terminal, `npm run dev`. Reinicie o Next.js ao mudar variáveis `NEXT_PUBLIC_*`. A URL compartilhada é `/salas/<id>`; o usuário entra, confirma o e-mail se necessário, retorna à sala e escolhe entrar. O painel oferece prévia local, câmera/microfone e saída.

### Render e LiveKit Cloud

`render.yaml` descreve dois Web Services HTTP gratuitos: Next.js e FastAPI. Revise os planos no Blueprint antes de criar serviços; não há deploy executado por esta alteração. Configure as variáveis marcadas `sync: false` no painel Render. Defina `NEXT_PUBLIC_API_URL` como a URL HTTPS do serviço API e `ALLOWED_ORIGINS` como a origem exata do site publicado (e `http://localhost:3000` durante desenvolvimento). Como `NEXT_PUBLIC_*` é incorporada ao build, dispare um novo build depois de alterá-la. O plano gratuito pode suspender serviços ociosos e causar cold start.

No LiveKit Cloud, crie um projeto e configure o webhook para `https://<api-render>/api/livekit/webhook`, assinando com a mesma chave configurada no backend. LiveKit Cloud cuida da sinalização e mídia; não suba seu servidor de mídia no Render. O backend usa `LIVEKIT_URL` diretamente e pode apontar para uma futura implantação LiveKit própria em VM, sem alteração no cliente.

### Demonstração com duas pessoas

1. Confirme e-mail e entre com a conta promovida a `teacher`; crie uma sala `authenticated_demo` e copie o link `/salas/<id>`.
2. Em outro perfil do navegador ou dispositivo, cadastre uma conta, confirme o e-mail e entre; abra o link compartilhado. Uma sala `members_only` rejeita usuários sem membro cadastrado.
3. Ambos autorizam câmera/microfone mediante ação do usuário e entram. A grade e o áudio são transportados diretamente pelo LiveKit. Verifique também mutar/desmutar, sair e encerrar pelo professor.
4. Para redes distintas, publique frontend/API em HTTPS e use a URL LiveKit Cloud WSS. `getUserMedia` não funciona em origens HTTP públicas.

Tokens LiveKit têm TTL de 10 minutos e escopo de uma sala; cada aba/dispositivo recebe identidade opaca própria, estável durante reconexão, com limite de quatro sessões simultâneas por conta. O token não expulsa alguém já conectado ao expirar. Encerrar a aula marca `closed` no Supabase e remove participantes pela RoomService do LiveKit. A opção authenticated_demo é intencionalmente aberta a qualquer usuário autenticado e confirmado; não a use para aulas privadas.

Não foram fornecidas credenciais Supabase/LiveKit, então autenticação remota, SMTP, execução real da migração, webhook e chamada entre dois dispositivos não puderam ser testados aqui. Testes automatizados usam mocks e não substituem a demonstração com câmera real. Revise os textos legais com orientação adequada antes da publicação.

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
