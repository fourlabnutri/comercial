# FourLab · Comercial (Painel B2B)

LP pública de captação de lojistas/revendedores + mini-CRM interno para o time comercial da FourLab Nutrition.

## Stack
- Front estático (HTML + JS módulo, sem build) — mesmo padrão dos outros projetos FourLab, hospedável em GitHub Pages.
- [Supabase](https://supabase.com) — projeto `heelubwizluflohywlgy` (`supabase-fourlab`): Postgres + Auth + Edge Functions.
- Cliente Supabase via ESM CDN (`esm.sh`).

## Páginas
| Arquivo | Função | Acesso |
|---|---|---|
| `index.html` | LP pública de captação de leads | público |
| `login.html` | Login (Supabase Auth, e-mail + senha) | público |
| `leads.html` | Lista de leads com busca e filtros | comercial + chefia |
| `lead.html?id=…` | Detalhe do lead: status, responsável, observações, histórico | comercial + chefia |
| `metricas.html` | Funil + uso do painel pelo time | **somente chefia** |

## Backend (Supabase)

### Tabelas (`public`)
- `commercial_users` — `id` = `auth.users.id`, `nome`, `email`, `role` (`comercial` \| `chefia`), `ativo`.
- `leads` — dados do lead + `razao_social`/`situacao_cnpj` (autofill Receita), `status`, `observacoes`, `responsavel_id`. `cnpj` único.
- `lead_status_history` — auditoria de cada mudança de etapa (para métricas de funil).
- `activity_logs` — telemetria de uso: `user_id`, `event_type`, `event_detail` (jsonb).

### Pipeline de status
`Novo → Em contato → Negociação → Fechado → Perdido`

### RLS
- `leads` / `lead_status_history`: leitura e gestão para qualquer usuário comercial ativo; **delete só chefia**.
- `commercial_users`: leitura para comercial ativo; escrita só chefia.
- `activity_logs`: cada usuário grava o próprio; **leitura só chefia**.
- Helpers: `is_active_commercial()`, `is_chefia()`, `current_commercial_role()`.

### Triggers
- `updated_at` automático em `leads`.
- Auto-atribuição de `responsavel_id` no insert (usuário logado).
- Gravação automática em `lead_status_history` (insert + toda mudança de `status`).

### Edge Function `submit-lead`
Recebe o POST da LP pública (`verify_jwt = false`), valida o CNPJ (dígito verificador + BrasilAPI: confirma situação **ATIVA** e faz autofill da razão social) e insere em `leads` com `service_role`. CNPJ duplicado → HTTP 409.

`POST https://heelubwizluflohywlgy.supabase.co/functions/v1/submit-lead`
```json
{ "nome_completo": "", "email": "", "whatsapp": "", "cnpj": "", "nome_loja": "", "instagram_loja": "" }
```

## Configuração
`config.js` guarda apenas chaves **públicas** (URL + publishable key). A segurança vem do RLS.
**Nunca** commitar a `service_role` key — ela vive só nas env vars da Edge Function no Supabase.

## Rodar local
Qualquer servidor estático, ex.:
```bash
npx serve .
```

## Criar usuários do time
1. Supabase → Authentication → Add user (e-mail + senha).
2. Inserir a linha correspondente em `commercial_users` com o mesmo `id`, definindo `role` e `ativo = true`.
