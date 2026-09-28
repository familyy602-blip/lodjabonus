# Publicar no GitHub Pages

## Estrutura correcta no repositório `lodjastore`

Na **raiz** do repositório devem estar estes ficheiros e pastas (NÃO meta-pasta `loja-virtual` por cima):

```
index.html
catalogo.html
carrinho.html
checkout.html
pedidos.html
produto.html
solicitar.html
logo-lodja.png
css/
  loja.css
js/
  admin-auth.js
  cart.js
  lodja-bridge.js
  loja-storage.js
  supabase-config.js
admin/
  index.html
  login.html
  produtos.html
  ...
sql/
```

## Passos

1. Apague o conteúdo antigo do repositório (ou limpe a pasta)
2. Extraia o ZIP
3. Entre na pasta `loja-virtual`
4. Envie **tudo o que está dentro** de `loja-virtual` para a raiz de `lodjastore`
5. Settings → Pages → Branch `main` → pasta `/ (root)`
6. Espere 1–2 minutos e actualize com Ctrl+F5

## Verificar

Abra:
- https://familyy602-blip.github.io/lodjastore/css/loja.css  
  Deve mostrar código CSS (não página 404).

Se der 404, a pasta `css` não foi enviada.
