import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.FOURLAB_CONFIG;
export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
export const STATUSES = cfg.STATUSES;

/* ---------- helpers de UI ---------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => n.append(k?.nodeType ? k : document.createTextNode(k ?? "")));
  return n;
};
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
export const pillClass = (status) =>
  "pill pill-" + (status || "").normalize("NFD").replace(/[^\w]/g, "");
export const onlyDigits = (s) => (s || "").replace(/\D/g, "");
export const fmtCnpj = (s) => {
  const d = onlyDigits(s).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

/* ---------- sessão / perfil ---------- */
export async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("commercial_users")
    .select("id, nome, email, role, ativo")
    .eq("id", user.id)
    .maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}

// Protege páginas internas. requireChefia=true bloqueia comercial comum.
export async function guard({ requireChefia = false } = {}) {
  const profile = await getProfile();
  if (!profile || !profile.ativo) {
    location.href = "login.html";
    return null;
  }
  if (requireChefia && profile.role !== "chefia") {
    location.href = "leads.html";
    return null;
  }
  renderTopbar(profile);
  logActivity("page_view", { path: location.pathname.split("/").pop() });
  return profile;
}

export function renderTopbar(profile) {
  const bar = $("#topbar");
  if (!bar) return;
  const here = location.pathname.split("/").pop() || "leads.html";
  const link = (href, label) =>
    `<a href="${href}" class="${here === href ? "active" : ""}">${label}</a>`;
  bar.innerHTML = `
    <span class="brand">FourLab · Comercial</span>
    <nav>
      ${link("leads.html", "Leads")}
      ${profile.role === "chefia" ? link("metricas.html", "Métricas") : ""}
      <a href="#" id="logout">Sair</a>
    </nav>
    <span class="who">${profile.nome} · ${profile.role}</span>`;
  $("#logout").onclick = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    location.href = "login.html";
  };
}

/* ---------- activity_logs ---------- */
export async function logActivity(event_type, event_detail = {}) {
  try {
    const user = await getSessionUser();
    if (!user) return;
    await supabase.from("activity_logs").insert({ user_id: user.id, event_type, event_detail });
  } catch (e) {
    /* silencioso — telemetria não pode quebrar a app */
  }
}
