import { Routes } from "@angular/router";
import { OverviewComponent } from "@modules/admin/components/overview/overview.component";
import { SourcesComponent } from "@modules/admin/components/sources/sources.component";
import { NormalizationComponent } from "@modules/admin/components/normalization/normalization.component";
import { IdentityComponent } from "@modules/admin/components/identity/identity.component";
import { GraphComponent } from "@modules/admin/components/graph/graph.component";
import { RulesComponent } from "@modules/admin/components/rules/rules.component";
import { HistoryComponent } from "@modules/admin/components/history/history.component";
import { GovernanceComponent } from "@modules/admin/components/governance/governance.component";
import { ApiComponent } from "@modules/admin/components/api/api.component";
import { SettingsComponent } from "@modules/admin/components/settings/settings.component";

export const childRoutes: Routes = [
  // Redirect base path to overview
  { path: "", redirectTo: "overview", pathMatch: "full" },
  
  // Redirect old 'dashboard' path to overview to prevent 404s
  { path: "dashboard", redirectTo: "overview", pathMatch: "full" },

  {
    path: "overview",
    component: OverviewComponent,
    data: { title: "Overview", icon: "dashboard" },
  },
  {
    path: "sources",
    component: SourcesComponent,
    data: { title: "Sources & Ingest", icon: "input" },
  },
  {
    path: "normalization",
    component: NormalizationComponent,
    data: { title: "Normalization", icon: "cleaning_services" },
  },
  {
    path: "identity",
    component: IdentityComponent,
    data: { title: "Identity & Records", icon: "fingerprint" },
  },
  {
    path: "explorer",
    component: GraphComponent,
    data: { title: "Graph Explorer", icon: "hub" },
  },
  {
    path: "rules",
    component: RulesComponent,
    data: { title: "Rules & Conflicts", icon: "gavel" },
  },
  {
    path: "history",
    component: HistoryComponent,
    data: { title: "History & Replay", icon: "history" },
  },
  {
    path: "governance",
    component: GovernanceComponent,
    data: { title: "Governance & Audits", icon: "admin_panel_settings" },
  },
  {
    path: "integrations",
    component: ApiComponent,
    data: { title: "APIs & Integrations", icon: "api" },
  },
  {
    path: "settings",
    component: SettingsComponent,
    data: { title: "Settings", icon: "settings" },
  },
];
