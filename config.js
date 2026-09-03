// Configuração pública do painel B2B FourLab.
// Estas chaves são PÚBLICAS por design (publishable/anon). A segurança vem das
// políticas RLS no Supabase. NUNCA colocar a service_role key aqui.
window.FOURLAB_CONFIG = {
  SUPABASE_URL: "https://heelubwizluflohywlgy.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_HO0Cn-5KTSQ2YMB9WXJyCA_hlzjycY6",
  SUBMIT_LEAD_FN: "https://heelubwizluflohywlgy.supabase.co/functions/v1/submit-lead",
  STATUSES: ["Novo", "Em contato", "Negociação", "Fechado", "Perdido"],
};
