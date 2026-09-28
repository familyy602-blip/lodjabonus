# Loja Virtual LODJA — integrada ao Bónus Lodja

Sistema de e-commerce em **HTML / CSS / JavaScript**, separado logicamente do LODJA (fidelização).

## Princípio

1. O cliente **compra na Loja Virtual**
2. O pedido passa por estados (pendente → … → concluído)
3. Só após **entregue/concluído** a compra é sincronizada com o **LODJA**
4. O LODJA acumula **peças**, elegibilidade e sorteios

## Como testar agora (sem SQL)

1. Abra `index.html` no browser (ou sirva a pasta por HTTP)
2. Admin: `admin/login.html` — password **admin123**
3. Dados de demonstração já vêm no modo local (localStorage)

## Produção com Supabase

1. No mesmo projecto Supabase do LODJA, execute `sql/schema-loja.sql`
2. As tabelas `lv_*` ficam criadas
3. A loja usa as mesmas credenciais em `js/supabase-config.js`

## Estrutura

```
loja-virtual/
  index.html          # Catálogo / home
  produto.html        # Página do produto
  carrinho.html
  checkout.html       # Solicitação de pedido
  pedidos.html        # Acompanhamento pelo cliente
  admin/              # Painel
  css/loja.css
  js/
    loja-storage.js   # Dados (Supabase + fallback local)
    cart.js           # Carrinho (não é compra LODJA)
    lodja-bridge.js   # Sincronização com compras do LODJA
  sql/schema-loja.sql
```

## Integração LODJA

- Referência única: `LOJA-000001`, `LOJA-000002`, …
- Ao marcar pedido **entregue** ou **concluído**, `LodjaBridge.sincronizarCompra`:
  - cria/actualiza cliente no LODJA (telefone)
  - insere linha em `compras` com `numero_factura = LOJA-…`
  - actualiza `total_pecas` e elegibilidade
  - evita duplicados

## Password admin loja

Padrão: `admin123` (igual ao LODJA para facilitar testes).
