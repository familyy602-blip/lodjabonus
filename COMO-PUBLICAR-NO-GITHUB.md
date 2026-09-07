# Como publicar no GitHub Pages (para o visual funcionar)

## Erro mais comum
Enviar só alguns ficheiros, ou deixar a pasta `css` de fora.
Sem a pasta `css`, o site fica branco/sem estilo e parece não ter menu.

## Passos correctos

1. Crie um repositório no GitHub (ex: `bonus-lodja`)
2. Envie **TODOS** estes itens para a **raiz** do repositório:
   - login.html, dashboard.html, roleta.html, index.html, ...
   - pasta **css/** (style.css e roleta.css)
   - pasta **js/** (todos os ficheiros)
3. NÃO deixe assim:
   - errado: `repo/bonus-loja/login.html`
   - certo: `repo/login.html`
4. GitHub → Settings → Pages:
   - Source: Deploy from a branch
   - Branch: `main` (ou `master`)
   - Folder: `/ (root)`
5. Espere 1–2 minutos
6. Abra: `https://SEU_USUARIO.github.io/NOME_DO_REPO/`

## Teste rápido
Abra: `https://SEU_USUARIO.github.io/NOME_DO_REPO/css/style.css`
- Se aparecer texto CSS → está certo
- Se der 404 → a pasta css não está no sítio certo

## Depois do login
O menu lateral (Dashboard, Clientes, Roleta, etc.) só aparece **depois de entrar** com a password no painel.
