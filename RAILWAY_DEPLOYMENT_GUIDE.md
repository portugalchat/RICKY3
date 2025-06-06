# Guia Completo - Deploy no Railway (ERRO RESOLVIDO)

## ⚠️ PROBLEMA RESOLVIDO
O erro `npm ci` foi corrigido. O `package-lock.json` está agora incluído no repositório.

## 📋 PASSO A PASSO DETALHADO

### PASSO 1: Configurar Redis (5 minutos)
1. Ir a https://upstash.com/
2. Criar conta com GitHub
3. "Create Database" → Nome: `chatportugal-redis`
4. Região: Europe West
5. **COPIAR** a Redis URL completa (exemplo: `redis://default:abc123@eu1-abc-123.upstash.io:6379`)

### PASSO 2: Download dos Ficheiros (2 minutos)
1. No Replit: Clicar nos 3 pontos (...) no explorador
2. "Download as zip"
3. Extrair o ficheiro

### PASSO 3: Limpar Ficheiros (2 minutos)
**ELIMINAR** estas pastas/ficheiros do zip extraído:
- `node_modules/` (pasta grande)
- `dist/` (se existir)
- `.replit` (ficheiro)
- `.env` (se existir - contém secrets)

**MANTER** tudo o resto, incluindo:
- `package-lock.json` ✅ (OBRIGATÓRIO para Railway)
- `client/`, `server/`, `shared/`
- Todos os ficheiros de configuração

### PASSO 4: Criar Repositório GitHub (3 minutos)
1. Ir a https://github.com/new
2. Nome: `chatportugal`
3. Público
4. **NÃO** adicionar README ou .gitignore
5. "Create repository"

### PASSO 5: Upload para GitHub (3 minutos)
1. Na página do repositório: "uploading an existing file"
2. Arrastar **TODOS** os ficheiros limpos
3. Commit message: "ChatPortugal - Ready for production"
4. "Commit changes"

### PASSO 6: Deploy no Railway (5 minutos)
1. Ir a https://railway.app/
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Autorizar Railway
5. Seleccionar `chatportugal`

### PASSO 7: Configurar Variáveis (5 minutos)
No Railway, ir a **Variables** e adicionar:

```
NODE_ENV=production
DATABASE_URL=[Sua Supabase Database URL]
SUPABASE_URL=[Sua Supabase URL]
SUPABASE_ANON_KEY=[Sua Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Sua Supabase Service Role Key]
REDIS_URL=[URL do Upstash copiada no Passo 1]
```

### PASSO 8: Deploy (10 minutos)
1. Railway faz deploy automaticamente
2. Aguardar "Deploy Successful"
3. Clicar na URL gerada
4. Testar: `https://seu-dominio.railway.app/api/health`

## 🔧 CONFIGURAÇÕES AUTOMÁTICAS
O Railway usará estas configurações (já incluídas nos ficheiros):

**Build Command:** `npm install && npm run build`
**Start Command:** `npm start`
**Health Check:** `/api/health`

## ✅ TESTES FINAIS
1. Abrir a aplicação
2. Registar utilizador
3. Upload de foto de perfil
4. Testar chat aleatório
5. Verificar health check: `/api/health`

## 💰 CUSTOS PREVISTOS
- Railway: $5-20/mês (baseado no uso)
- Upstash Redis: $0-20/mês
- Supabase: $0-25/mês
- **Total: $5-65/mês**

## 🚨 SE HOUVER ERROS

### Deploy Falha:
1. Verificar logs no Railway Dashboard
2. Confirmar todas as variáveis estão correctas
3. Verificar `package-lock.json` está no repositório

### Health Check Falha:
1. Verificar `DATABASE_URL` da Supabase
2. Verificar `REDIS_URL` do Upstash
3. Ver logs de erro no Railway

### Upload de Fotos Não Funciona:
1. Verificar `SUPABASE_SERVICE_ROLE_KEY`
2. Confirmar bucket existe na Supabase

O deploy agora deve funcionar sem o erro `npm ci`!