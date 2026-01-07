import { Component } from '@angular/core';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  standalone: false
})
export class SideNavComponent {
  navItems = [
    { title: 'Overview', path: '/overview' },
    { title: 'Sources & Ingest', path: '/sources' },
    { title: 'Normalization', path: '/normalization' },
    { title: 'Identity & Records', path: '/identity' },
    { title: 'Graph Explorer', path: '/explorer' },
    { title: 'Rules & Conflicts', path: '/rules' },
    { title: 'History & Replay', path: '/history' },
    { title: 'Governance & Audits', path: '/governance' },
    { title: 'APIs & Integrations', path: '/integrations' },
    { title: 'Settings', path: '/settings' }
  ];
}