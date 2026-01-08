import { Routes } from '@angular/router';
import { ApiComponent } from '@modules/admin/components/api/api.component';
import { GovernanceComponent } from '@modules/admin/components/governance/governance.component';
import { GraphComponent } from '@modules/admin/components/graph/graph.component';
import { HistoryComponent } from '@modules/admin/components/history/history.component';
import { IdentityComponent } from '@modules/admin/components/identity/identity.component';
import { NormalizationComponent } from '@modules/admin/components/normalization/normalization.component';
import { OverviewComponent } from '@modules/admin/components/overview/overview.component';
import { RulesComponent } from '@modules/admin/components/rules/rules.component';
import { SettingsComponent } from '@modules/admin/components/settings/settings.component';
import { SourcesComponent } from '@modules/admin/components/sources/sources.component';

// Secondary Ingest Components
import { AdvancedComponent } from '@modules/admin/components/sources/advanced/advanced.component';
import { DriftComponent } from '@modules/admin/components/sources/drift/drift.component';
import { ListComponent } from '@modules/admin/components/sources/list/list.component';
import { SyncComponent } from '@modules/admin/components/sources/sync/sync.component';
import { ValidationComponent } from '@modules/admin/components/sources/validation/validation.component';

export const childRoutes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: 'overview', pathMatch: 'full' },

  {
    path: 'overview',
    component: OverviewComponent,
    data: { title: 'Overview', icon: 'dashboard' },
  },
  {
    path: 'sources',
    component: SourcesComponent,
    data: { title: 'Sources & Ingest', icon: 'input' },
    children: [
      // Default to the list view when clicking 'Sources & Ingest'
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        component: ListComponent,
        data: { title: 'Sources' },
      },
      {
        path: 'drift',
        component: DriftComponent,
        data: { title: 'Schema & Drift' },
      },
      {
        path: 'validation',
        component: ValidationComponent,
        data: { title: 'Validation' },
      },
      {
        path: 'sync',
        component: SyncComponent,
        data: { title: 'Load & Sync' },
      },
      {
        path: 'advanced',
        component: AdvancedComponent,
        data: { title: 'Advanced' },
      },
    ],
  },
  {
    path: 'normalization',
    component: NormalizationComponent,
    data: { title: 'Normalization', icon: 'cleaning_services' },
  },
  {
    path: 'identity',
    component: IdentityComponent,
    data: { title: 'Identity & Records', icon: 'fingerprint' },
  },
  {
    path: 'explorer',
    component: GraphComponent,
    data: { title: 'Graph Explorer', icon: 'hub' },
  },
  {
    path: 'rules',
    component: RulesComponent,
    data: { title: 'Rules & Conflicts', icon: 'gavel' },
  },
  {
    path: 'history',
    component: HistoryComponent,
    data: { title: 'History & Replay', icon: 'history' },
  },
  {
    path: 'governance',
    component: GovernanceComponent,
    data: { title: 'Governance & Audits', icon: 'admin_panel_settings' },
  },
  {
    path: 'integrations',
    component: ApiComponent,
    data: { title: 'APIs & Integrations', icon: 'api' },
  },
  {
    path: 'settings',
    component: SettingsComponent,
    data: { title: 'Settings', icon: 'settings' },
  },
];
