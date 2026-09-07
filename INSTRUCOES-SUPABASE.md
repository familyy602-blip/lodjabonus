# Ligar o Bónus Lodja - Compre e ganhe ao Supabase

## 1. Executar o Schema (OBRIGATÓRIO)

1. Abre o teu projecto no Supabase
2. No menu esquerdo clica em **SQL Editor**
3. Clica em **New query**
4. Abre o ficheiro `supabase-schema.sql` que está na pasta do projecto
5. Copia TODO o conteúdo e cola no SQL Editor
6. Clica em **Run** (ou Ctrl+Enter)

Se aparecer "Success", as tabelas foram criadas.

## 2. Verificar tabelas

Vai a **Table Editor** e confirma que existem:
- clientes
- compras
- premios
- sorteios
- config

## 3. Abrir o sistema

1. Abre `login.html` no browser
2. Password: `admin123`
3. No Dashboard clica em **Importar Base de Dados** para carregar os clientes do Excel

## 4. Credenciais já configuradas

URL: https://edidkxeuoynezvucuwam.supabase.co
Key: (já está no ficheiro js/supabase-config.js)

## Notas

- Os dados agora ficam na nuvem (Supabase)
- Funcionam em qualquer dispositivo
- Quando publicares o site (GitHub Pages / Netlify), os links da roleta funcionam no WhatsApp
