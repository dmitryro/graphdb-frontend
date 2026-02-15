import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

interface StorageBackend {
  type: 'embedded' | 'external' | 'distributed';
  label: string;
  sublabel: string;
  connectionUri?: string;
  username?: string;
  password?: string;
  readWriteMode?: string;
  latency?: string;
}

interface ReplicationConfig {
  mode: 'one-way' | 'bi-directional';
  multiRegion: string[];
  enabled: boolean;
}

interface MigrationItem {
  source: string;
  target: string;
  mode: string;
  scope: string;
  lastMigration: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface BackupConfig {
  incrementalInterval: string;
  lastSnapshot: string;
  restoreDate?: Date;
  dryRun: boolean;
  snapshotsEnabled: boolean;
}

interface EnvironmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-advanced',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './advanced.component.html',
  styleUrls: ['./advanced.component.scss'],
  providers: [EventService],
})
export class AdvancedComponent implements OnInit, OnDestroy {
  // ============================================================================
  // SIGNALS - STATE MANAGEMENT
  // ============================================================================

  public theme = signal<'light' | 'dark'>('dark');
  public currentEnvironment = signal<string>('production');
  public currentBackend = signal<'embedded' | 'external' | 'distributed'>('embedded');

  // Storage Backend Signals
  public storageBackends = signal<StorageBackend[]>([
    {
      type: 'embedded',
      label: 'Embedded',
      sublabel: 'Sled / RocksDB',
      readWriteMode: 'Read/Write',
      latency: '~ 2ms',
    },
    {
      type: 'external',
      label: 'External Database',
      sublabel: '',
      connectionUri: 'database.example.com',
      username: '',
      password: '',
      readWriteMode: 'Read/Write',
      latency: '~ 2ms',
    },
    {
      type: 'distributed',
      label: 'Distributed',
      sublabel: 'TiKV',
      connectionUri: 'database.example.com',
      username: 'username',
      password: '••••',
      readWriteMode: 'Read/Write',
    },
  ]);

  // Replication Signals
  public replicationConfig = signal<ReplicationConfig>({
    mode: 'one-way',
    multiRegion: ['us-east-1', 'us-wrest-2'],
    enabled: true,
  });

  public availableRegions = signal<string[]>([
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-wrest-2',
    'eu-west-1',
    'eu-central-1',
    'ap-southeast-1',
    'ap-northeast-1',
  ]);

  // Migration Signals
  public migrations = signal<MigrationItem[]>([
    {
      source: 'Epic Health Network',
      target: 'Online',
      mode: 'Full',
      scope: 'Completed',
      lastMigration: 'Completed',
      status: 'completed',
    },
    {
      source: 'Slack EMR',
      target: 'Online',
      mode: 'Full',
      scope: '3 hours ago',
      lastMigration: '3 hours ago',
      status: 'completed',
    },
  ]);

  // Backup & Restore Signals
  public backupConfig = signal<BackupConfig>({
    incrementalInterval: 'every 4 hours',
    lastSnapshot: '3 hours ago',
    restoreDate: new Date(2024, 3, 26, 13, 30, 0),
    dryRun: false,
    snapshotsEnabled: true,
  });

  // Environment Options
  public environments = signal<EnvironmentOption[]>([
    { value: 'production', label: 'Production' },
    { value: 'staging', label: 'Staging' },
    { value: 'development', label: 'Development' },
    { value: 'testing', label: 'Testing' },
  ]);

  // Computed Signals
  public currentBackendConfig = computed(() => {
    const backends = this.storageBackends();
    const current = this.currentBackend();
    return backends.find(b => b.type === current);
  });

  public replicationStatus = computed(() => {
    return this.replicationConfig().enabled ? 'Enabled' : 'Disabled';
  });

  public backupStatus = computed(() => {
    return this.backupConfig().snapshotsEnabled ? 'Active' : 'Inactive';
  });

  // ============================================================================
  // NGRX & EVENT SUBSCRIPTIONS
  // ============================================================================

  private eventSubs?: Subscription;

  constructor(
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.subscribeToEvents();
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const isDark = document.body.classList.contains('dark-theme');
    this.theme.set(isDark ? 'dark' : 'light');
  }

  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (!state?.items) return;
      const { event, payload } = state.items;

      // Load storage configuration
      if (event === 'storage_config_loaded' || payload?.action === 'load_storage_config') {
        this.handleStorageConfigLoad(payload);
      }

      // Backend change confirmed
      if (event === 'storage_backend_changed' || payload?.action === 'storage_backend_changed') {
        this.handleBackendChange(payload);
      }

      // Replication config updated
      if (event === 'replication_config_updated' || payload?.action === 'update_replication') {
        this.handleReplicationUpdate(payload);
      }

      // Migration completed
      if (event === 'migration_completed' || payload?.action === 'migration_complete') {
        this.handleMigrationComplete(payload);
      }

      // Backup/Restore actions
      if (event === 'snapshot_taken' || payload?.action === 'snapshot_created') {
        this.handleSnapshotCreated(payload);
      }

      if (event === 'restore_completed' || payload?.action === 'restore_complete') {
        this.handleRestoreComplete(payload);
      }

      // Confirmation dialogs
      if (event === 'confirmation_save_confirmed' && payload?.confirmed) {
        this.handleConfirmationAction(payload);
      }

      // Environment change
      if (event === 'environment_changed' || payload?.action === 'switch_environment') {
        this.handleEnvironmentChange(payload);
      }
    });
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private handleStorageConfigLoad(payload: any): void {
    if (payload.storageBackends) {
      this.storageBackends.set(payload.storageBackends);
    }
    if (payload.currentBackend) {
      this.currentBackend.set(payload.currentBackend);
    }
    if (payload.replicationConfig) {
      this.replicationConfig.set(payload.replicationConfig);
    }
    if (payload.migrations) {
      this.migrations.set(payload.migrations);
    }
    if (payload.backupConfig) {
      this.backupConfig.set(payload.backupConfig);
    }
    if (payload.theme) {
      this.theme.set(payload.theme);
    }
  }

  private handleBackendChange(payload: any): void {
    if (payload.backend) {
      this.currentBackend.set(payload.backend);
      console.log('Storage backend switched to:', payload.backend);
    }
  }

  private handleReplicationUpdate(payload: any): void {
    if (payload.replicationConfig) {
      this.replicationConfig.set(payload.replicationConfig);
      console.log('Replication config updated:', payload.replicationConfig);
    }
  }

  private handleMigrationComplete(payload: any): void {
    if (payload.migration) {
      const currentMigrations = this.migrations();
      this.migrations.set([payload.migration, ...currentMigrations]);
      console.log('Migration completed:', payload.migration);
    }
  }

  private handleSnapshotCreated(payload: any): void {
    const config = this.backupConfig();
    this.backupConfig.set({
      ...config,
      lastSnapshot: payload.timestamp || 'just now',
    });
    console.log('Snapshot created at:', payload.timestamp);
  }

  private handleRestoreComplete(payload: any): void {
    console.log('Restore completed:', payload);
  }

  private handleConfirmationAction(payload: any): void {
    if (payload.command === 'change_backend') {
      this.executeBackendChange(payload.backend);
    } else if (payload.command === 'restore_backup') {
      this.executeRestore();
    } else if (payload.command === 'take_snapshot') {
      this.executeSnapshot();
    }
  }

  private handleEnvironmentChange(payload: any): void {
    if (payload.environment) {
      this.currentEnvironment.set(payload.environment);
      console.log('Environment switched to:', payload.environment);
    }
  }

  // ============================================================================
  // STORAGE BACKEND ACTIONS
  // ============================================================================

  onBackendChange(type: 'embedded' | 'external' | 'distributed'): void {
    this.currentBackend.set(type);
  }

  openChangeBackendModal(): void {
    this.eventService.publish('nf', 'open_change_backend_modal', {
      action: 'open_change_backend_modal',
      currentBackend: this.currentBackend(),
      availableBackends: this.storageBackends(),
      theme: this.theme(),
    });
  }

  private executeBackendChange(backend: 'embedded' | 'external' | 'distributed'): void {
    this.eventService.publish('nf', 'storage_backend_change_requested', {
      action: 'storage_backend_change_requested',
      backend: backend,
      environment: this.currentEnvironment(),
    });
  }

  // ============================================================================
  // REPLICATION ACTIONS
  // ============================================================================

  editReplicationRules(): void {
    this.eventService.publish('nf', 'open_replication_editor', {
      action: 'open_replication_editor',
      currentConfig: this.replicationConfig(),
      availableRegions: this.availableRegions(),
      theme: this.theme(),
    });
  }

  onReplicationModeChange(mode: 'one-way' | 'bi-directional'): void {
    const config = this.replicationConfig();
    this.replicationConfig.set({
      ...config,
      mode: mode,
    });
  }

  // ============================================================================
  // MIGRATION ACTIONS
  // ============================================================================

  openMigrationWizard(): void {
    this.eventService.publish('nf', 'open_migration_wizard', {
      action: 'open_migration_wizard',
      currentBackend: this.currentBackend(),
      availableBackends: this.storageBackends(),
      theme: this.theme(),
    });
  }

  // ============================================================================
  // BACKUP & RESTORE ACTIONS
  // ============================================================================

  takeSnapshot(): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Take Manual Snapshot',
      action: 'open_confirmation_modal',
      message: 'Are you sure you want to create a manual snapshot of the current ingestion state?',
      command: 'take_snapshot',
      itemName: 'Manual Snapshot',
      theme: this.theme(),
    });
  }

  scheduleSnapshot(): void {
    this.eventService.publish('nf', 'open_snapshot_scheduler', {
      action: 'open_snapshot_scheduler',
      currentSchedule: this.backupConfig().incrementalInterval,
      theme: this.theme(),
    });
  }

  viewSnapshots(): void {
    this.eventService.publish('nf', 'open_snapshots_viewer', {
      action: 'open_snapshots_viewer',
      environment: this.currentEnvironment(),
      theme: this.theme(),
    });
  }

  restoreBackup(): void {
    const config = this.backupConfig();

    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Restore Backup',
      action: 'open_confirmation_modal',
      message: `Are you sure you want to restore to ${config.restoreDate?.toLocaleString()}?${config.dryRun ? ' (Dry-run mode enabled)' : ' This will overwrite current data.'}`,
      command: 'restore_backup',
      itemName: config.restoreDate?.toLocaleString(),
      theme: this.theme(),
    });
  }

  private executeSnapshot(): void {
    this.eventService.publish('nf', 'create_snapshot_requested', {
      action: 'create_snapshot_requested',
      environment: this.currentEnvironment(),
      timestamp: new Date().toISOString(),
    });
  }

  private executeRestore(): void {
    const config = this.backupConfig();

    this.eventService.publish('nf', 'restore_backup_requested', {
      action: 'restore_backup_requested',
      restoreDate: config.restoreDate,
      dryRun: config.dryRun,
      environment: this.currentEnvironment(),
    });
  }

  // ============================================================================
  // ENVIRONMENT ACTIONS
  // ============================================================================

  onEnvironmentChange(environment: string): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Switch Environment',
      action: 'open_confirmation_modal',
      message: `Are you sure you want to switch to the ${environment} environment? This will reload the configuration.`,
      command: 'switch_environment',
      itemName: environment,
      theme: this.theme(),
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getCurrentBackendConfig(): StorageBackend | undefined {
    return this.currentBackendConfig();
  }

  getEnvironmentLabel(): string {
    const current = this.currentEnvironment();
    const env = this.environments().find(e => e.value === current);
    return env?.label || 'Unknown';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }
}
