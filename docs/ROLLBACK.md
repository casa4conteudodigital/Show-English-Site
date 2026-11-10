# Backup e retorno à versão anterior

Ponto anterior à migração: commit `ce0bfec`, tag `backup/pre-next-2026-11-10`.
Branch de trabalho: `codex/next-python-migration`.

Backup local independente do Git:
`backups/show-english-before-next.tar.gz`

SHA-256:
`efbde6f67e3d47907b02952b0e39345f89f5ff34a4b50762aa0400f3b0bebce0`

O arquivo contém os 22 arquivos versionados originais, incluindo imagens e vídeos. O conteúdo foi comparado byte a byte com os arquivos de origem antes da finalização. Não contém segredos nem arquivos não versionados (o Git estava limpo). A pasta backups é ignorada pelo Git para não duplicar o arquivo de 155 MB no histórico. Copie-a para outro dispositivo se quiser proteção contra perda do computador.

## Abrir o original sem mexer na migração

Execute na raiz do projeto:

```bash
git worktree add ../Show-English-original backup/pre-next-2026-11-10
```

Abra `../Show-English-original/index.html` ou sirva essa pasta com um servidor estático. Isso não apaga nem altera a branch Next.js.

Alternativa sem depender do Git:

```bash
sha256sum -c backups/SHA256SUMS
mkdir -p ../Show-English-restaurado
tar -xzf backups/show-english-before-next.tar.gz -C ../Show-English-restaurado
```

Use uma pasta nova/vazia para a restauração. Evite extrair por cima da versão em desenvolvimento.

## Retornar a hospedagem

A migração não foi publicada. Caso seja publicada posteriormente, restaure o deployment anterior pela hospedagem ou publique o conteúdo da tag de backup com a configuração estática original. Um rollback de código não altera configurações, variáveis ou dados no Supabase. Não execute scripts de exclusão de banco para voltar o frontend.

## Novas versões

Após testar uma mudança:

```bash
git add <arquivos-alterados>
git commit -m "Descreva a mudança"
```

O histórico, a branch e as tags são locais até serem enviados ao remoto. Para compartilhar posteriormente, envie deliberadamente a branch e as tags desejadas. Não houve push automático.
