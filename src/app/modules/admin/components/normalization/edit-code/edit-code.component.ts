import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './edit-code.component.html',
  styleUrl: './edit-code.component.scss',
})
export class EditCodeComponent implements OnInit, OnDestroy {
  @Input() codeData: any = null;
  @Output() closeEdit = new EventEmitter<void>();

  @HostBinding('class.slide-out-to-right') isExiting = false;

  private eventSubs?: Subscription;

  // Form controls
  descriptionControl = new FormControl('');
  statusControl = new FormControl('Active');

  // Status options
  statusOptions = ['Active', 'Deprecated', 'Superseded'];

  // Pending changes tracking
  pendingChanges: any[] = [];
  originalData: any = {};

  constructor(
    private eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    if (this.codeData) {
      this.initializeData();
    }

    this.subscribeToEvents();
    this.updateBreadcrumb();
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }

  private initializeData(): void {
    // Store original data for comparison
    this.originalData = {
      meaning: this.codeData.meaning || '',
      status: this.codeData.status || 'Active',
    };

    // Set form values
    this.descriptionControl.setValue(this.originalData.meaning);
    this.statusControl.setValue(this.originalData.status);
  }

  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const eventData = state?.items?.payload;

      // Handle close event
      if (eventName === 'close_edit_code') {
        this.onCancel();
      }

      // Handle confirmation responses
      if (eventName === 'confirmation_response' && eventData) {
        this.handleConfirmationResponse(eventData);
      }
    });
  }

  private updateBreadcrumb(): void {
    const codeName = this.codeData?.codeSetName || 'Code';
    const system = this.codeData?.system || '';
    const displayName = system ? `${codeName} · ${system}` : codeName;

    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Codes', target: 'TAB_CODES' },
      { label: `Editing Code: ${displayName}`, active: true },
    ];

    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  // Track changes
  onDescriptionChange(): void {
    this.trackChange('description', this.originalData.meaning, this.descriptionControl.value);
  }

  onStatusChange(): void {
    this.trackChange('status', this.originalData.status, this.statusControl.value);
  }

  private trackChange(field: string, oldValue: any, newValue: any): void {
    // Remove existing change for this field
    this.pendingChanges = this.pendingChanges.filter(c => c.field !== field);

    // Add new change if values differ
    if (oldValue !== newValue) {
      this.pendingChanges.push({
        field,
        oldValue,
        newValue,
        changeType: this.getChangeType(field),
      });
    }
  }

  private getChangeType(field: string): string {
    const typeMap: Record<string, string> = {
      description: 'description-modified',
      status: 'status-changed',
    };
    return typeMap[field] || 'field-modified';
  }

  // Actions
  onSave(): void {
    if (this.pendingChanges.length === 0) {
      console.warn('[EditCode] No changes to save');
      return;
    }

    // Open confirmation modal
    const theme = this.getActiveTheme();
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Save Changes?',
      message: `You have ${this.pendingChanges.length} pending change(s). Do you want to save them?`,
      command: 'save',
      itemName: this.codeData?.codeSetName || 'Code',
      theme,
      action: 'open_confirmation_modal',
    });
  }

  onCancel(): void {
    if (this.pendingChanges.length > 0) {
      // Open confirmation modal
      const theme = this.getActiveTheme();
      this.eventService.publish('nf', 'open_confirmation_modal', {
        title: 'Discard Changes?',
        message: `You have ${this.pendingChanges.length} unsaved change(s). Are you sure you want to discard them?`,
        command: 'discard',
        itemName: this.codeData?.codeSetName || 'Code',
        theme,
        action: 'discard',
      });
    } else {
      this.executeClose();
    }
  }

  onDelete(): void {
    const theme = this.getActiveTheme();
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Delete Code?',
      message: `Are you sure you want to delete "${this.codeData?.codeSetName}"? This action cannot be undone.`,
      command: 'delete_code',
      itemName: this.codeData?.codeSetName || 'Code',
      theme,
      action: 'delete',
    });
  }

  onReset(): void {
    if (this.pendingChanges.length === 0) {
      return;
    }

    const theme = this.getActiveTheme();
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Reset All Changes?',
      message: 'This will discard all pending changes and restore original values.',
      command: 'reset_code_changes',
      itemName: this.codeData?.codeSetName || 'Code',
      theme,
      action: 'reset',
    });
  }

  private handleConfirmationResponse(data: any): void {
    const { confirmed, command } = data;

    if (!confirmed) {
      return;
    }

    switch (command) {
      case 'save_code_changes':
        this.finalizeSave();
        break;
      case 'discard_code_changes':
        this.executeClose();
        break;
      case 'delete_code':
        this.executeDelete();
        break;
      case 'reset_code_changes':
        this.executeReset();
        break;
    }
  }

  private finalizeSave(): void {
    console.log('[EditCode] Saving changes:', this.pendingChanges);

    // In real implementation, call API here
    // For now, just publish event and close
    this.eventService.publish('nf', 'code_changes_saved', {
      codeId: this.codeData?.id,
      changes: this.pendingChanges,
    });

    this.executeClose();
  }

  private executeDelete(): void {
    console.log('[EditCode] Deleting code:', this.codeData?.id);

    // In real implementation, call API here
    this.eventService.publish('nf', 'code_deleted', {
      codeId: this.codeData?.id,
    });

    this.executeClose();
  }

  private executeReset(): void {
    // Reset form controls
    this.descriptionControl.setValue(this.originalData.meaning);
    this.statusControl.setValue(this.originalData.status);

    // Clear pending changes
    this.pendingChanges = [];
  }

  private executeClose(): void {
    this.isExiting = true;
    setTimeout(() => {
      this.closeEdit.emit();
    }, 500);
  }

  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  get hasChanges(): boolean {
    return this.pendingChanges.length > 0;
  }

  get changesSummary(): string {
    const count = this.pendingChanges.length;
    return count === 1 ? '1 change' : `${count} changes`;
  }
}
