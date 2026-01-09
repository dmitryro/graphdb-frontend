import { Component } from '@angular/core';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  standalone: false,
})
export class SideNavComponent {
  navItems = [
    { title: 'Overview', path: '/overview' },
    {
      title: 'Sources & Ingest',
      path: '/sources',
      expanded: false,
      children: [
        { title: 'Sources', path: '/sources/list' },
        { title: 'Schema & Drift', path: '/sources/drift' },
        { title: 'Validation', path: '/sources/validation' },
        { title: 'Load & Sync', path: '/sources/sync' },
        { title: 'Advanced', path: '/sources/advanced' },
      ],
    },
    { title: 'Normalization', path: '/normalization' },
    { title: 'Identity & Records', path: '/identity' },
    { title: 'Graph Explorer', path: '/explorer' },
    {
      title: 'Rules & Conflicts',
      path: '/rules',
      expanded: false,
      children: [
        { title: 'Rules', path: '/rules/list' },
        { title: 'Active Conflicts', path: '/rules/conflicts' },
        { title: 'Resolution', path: '/rules/resolution' },
        { title: 'History', path: '/rules/history' },
      ],
    },
    { title: 'History & Replay', path: '/history' },
    {
      title: 'Governance & Audits',
      path: '/governance',
      expanded: false,
      children: [
        { title: 'Audit Log', path: '/governance/audit' },
        { title: 'Lineage', path: '/governance/lineage' },
        { title: 'Compliance', path: '/governance/compliance' },
        { title: 'Evidence Export', path: '/governance/evidence' },
      ],
    },
    { title: 'APIs & Integrations', path: '/integrations' },
    {
      title: 'Settings',
      path: '/settings',
      expanded: false,
      children: [
        { title: 'Users & Access', path: '/settings/users' },
        { title: 'Environments', path: '/settings/environments' },
        { title: 'Secrets & Keys', path: '/settings/secrets' },
        { title: 'Configuration', path: '/settings/configuration' },
        { title: 'Advanced', path: '/settings/advanced' },
      ],
    },
  ];

  toggleExpand(item: any) {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }
}
