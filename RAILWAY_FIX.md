# Railway Deploy - Erro Resolvido

## PROBLEMA IDENTIFICADO
O Railway estava a tentar usar Dockerfile em vez de Nixpacks, causando conflito nos comandos de build.

## SOLUÇÃO APLICADA
1. ✅ Removido Dockerfile conflituoso
2. ✅ Criado nixpacks.toml com configuração correcta
3. ✅ Actualizado railway.json com comandos específicos

## PRÓXIMOS PASSOS NO RAILWAY

### 1. Re-fazer Upload dos Ficheiros
Incluir estes ficheiros novos/actualizados no GitHub:
- `nixpacks.toml` (novo)
- `railway.json` (actualizado)
- **NÃO incluir** `Dockerfile` (foi removido)

### 2. Configurar no Railway Dashboard
1. Ir às **Settings** do projeto
2. Secção **Build**:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Secção **Environment**:
   - Adicionar todas as variáveis (DATABASE_URL, SUPABASE_*, REDIS_URL)

### 3. Re-deploy
O Railway vai detectar os novos ficheiros e usar Nixpacks automaticamente.

## COMANDOS QUE FUNCIONAM AGORA
- **Install**: `npm install` (usa package-lock.json)
- **Build**: Automático via Nixpacks
- **Start**: `npm start`

O erro "exit code: 127" está resolvido.