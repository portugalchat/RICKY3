# ChatPortugal - Guia de Deployment para Produção

## Arquitectura para Milhões de Utilizadores

### 1. **Serviços Obrigatórios**

#### Base de Dados
- **Supabase** (já configurado)
  - Migrar para plano Pro ($25/mês)
  - Configurar connection pooling
  - Activar Read Replicas para diferentes regiões

#### File Storage & CDN
- **Supabase Storage** (já configurado)
  - Activar CDN para entrega global
  - Configurar cache policies

#### Redis (Clustering & Sessions)
- **Upstash Redis** (recomendado para produção)
  - URL: https://upstash.com/
  - Alternativa: **Redis Cloud** ou **AWS ElastiCache**

#### Hosting & Deployment
- **Railway** (recomendado - mais simples)
  - URL: https://railway.app/
  - Deploy automático via GitHub
  - Escalamento automático

- **Alternativas:**
  - **Vercel** (para frontend + API routes)
  - **DigitalOcean App Platform**
  - **AWS ECS** (mais complexo mas mais escalável)

### 2. **Configuração Passo-a-Passo**

#### Passo 1: Configurar Redis
1. Criar conta em **Upstash**: https://upstash.com/
2. Criar nova base de dados Redis
3. Copiar a `REDIS_URL`
4. Adicionar aos secrets da aplicação

#### Passo 2: Preparar Repositório
```bash
# 1. Criar repositório no GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seuusername/chatportugal.git
git push -u origin main
```

#### Passo 3: Deploy no Railway
1. Aceder a https://railway.app/
2. Conectar conta GitHub
3. "New Project" > "Deploy from GitHub repo"
4. Seleccionar o repositório
5. Adicionar variáveis de ambiente:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL`
   - `NODE_ENV=production`

#### Passo 4: Configurar Domínio
1. No Railway, ir a Settings > Domains
2. Adicionar domínio personalizado
3. Configurar DNS records

### 3. **Optimizações para Escala**

#### Performance
- **Connection Pooling**: Supabase Pro inclui PgBouncer
- **Redis Clustering**: Para sessões distribuídas
- **CDN**: Cloudflare (grátis) para static assets
- **Load Balancing**: Railway auto-scaling

#### Monitorização
- **Sentry** para error tracking
- **LogRocket** para session replay
- **Supabase Analytics** para métricas de base de dados

#### Segurança
- **Rate Limiting**: Nginx configurado
- **CORS**: Configurado para domínio de produção
- **HTTPS**: Automático no Railway
- **Environment Variables**: Nunca expor secrets

### 4. **Estrutura de Custos (Estimativa Mensal)**

#### Para 100k+ utilizadores activos:
- **Supabase Pro**: $25
- **Upstash Redis**: $20-50
- **Railway**: $20-100 (baseado no usage)
- **Cloudflare**: $0-20
- **Domínio**: $10-15
- **Total**: ~$75-210/mês

#### Para 1M+ utilizadores:
- **Supabase Team**: $599
- **Redis Enterprise**: $200+
- **Railway/AWS**: $500+
- **Total**: ~$1300+/mês

### 5. **Scripts de Build para Produção**

Adicionar ao package.json (via linha de comandos):
```bash
npm pkg set scripts.build="npm run build:client && npm run build:server"
npm pkg set scripts.build:client="vite build"
npm pkg set scripts.build:server="esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
npm pkg set scripts.start="NODE_ENV=production node dist/index.js"
```

### 6. **Configuração de Produção**

#### Railway Build Commands:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

#### Environment Variables Railway:
```
NODE_ENV=production
DATABASE_URL=[Supabase Connection String]
SUPABASE_URL=[Supabase Project URL]
SUPABASE_ANON_KEY=[Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Supabase Service Role Key]
REDIS_URL=[Upstash Redis URL]
```

### 7. **Testes de Stress**

#### Antes do lançamento:
```bash
# Instalar k6 para load testing
npm install -g k6

# Teste de carga
k6 run load-test.js
```

### 8. **Backup & Disaster Recovery**

- **Supabase**: Backups automáticos no plano Pro
- **Redis**: Persistência activada
- **Code**: GitHub como source of truth
- **Monitoring**: Uptime checks via Railway

### 9. **Próximos Passos**

1. **Configurar Redis** (Upstash)
2. **Push para GitHub**
3. **Deploy no Railway**
4. **Configurar domínio**
5. **Testar performance**
6. **Monitorizar e optimizar**

Esta configuração suporta facilmente milhões de utilizadores com escalamento automático e infraestrutura global.