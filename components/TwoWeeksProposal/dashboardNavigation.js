// Existing SMS tab params stay valid. Discard link access tokens after server authentication.
export const DETAIL_TABS = ["candidate", "schedule", "result", "profile", "status", "deposit", "invite", "overview", "conditions", "availability", "withdrawal"];
export const DASHBOARD_SECTIONS = ["home", "intro", "my"];
export const sectionForTab = (tab) => ["candidate", "schedule", "result"].includes(tab) ? "intro" : "my";
function firstQueryValue(value) {return Array.isArray(value) ? value[0] || "" : String(value || "");}
export function safeDashboardTargetQuery(query = {}) {
  const tab = firstQueryValue(query.tab);
  const section = firstQueryValue(query.section);
  return {
    ...(DETAIL_TABS.includes(tab) ? { tab } : {}),
    ...(DASHBOARD_SECTIONS.includes(section) ? { section } : {}),
  };
}
