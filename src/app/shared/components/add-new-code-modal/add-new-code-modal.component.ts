import { Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

/**
 * Interface representing the structure of a Code entry.
 */
interface CodeEntry {
  codeValue: string;
  label: string;
  description: string;
  status: string;
}

/**
 * Interface for the specific event payload expected by this component.
 */
interface CodeModalPayload {
  action?: string;
  theme?: 'light' | 'dark';
  codeSetData?: {
    name: string;
    codeValueType: string;
    uniquenessScope: string;
    existingCodes: CodeEntry[];
    deprecatedAllowed: boolean;
  };
}

@Component({
  selector: 'app-add-new-code-modal',
  standalone: false,
  templateUrl: './add-new-code-modal.component.html',
  styleUrls: ['./add-new-code-modal.component.scss'],
  providers: [EventService],
})
export class AddNewCodeModalComponent implements OnInit, OnDestroy {
  // Signals
  public isOpen = signal<boolean>(false);
  public theme = signal<'light' | 'dark'>('light');

  // Code Set Context (from parent)
  public codeSetName = signal<string>('');
  public codeValueType = signal<string>('');
  public uniquenessScope = signal<string>('');
  public existingCodes = signal<CodeEntry[]>([]);
  public deprecatedAllowed = signal<boolean>(false);

  private eventSubs?: Subscription;
  codeForm!: FormGroup;

  // Status options - Made readonly to satisfy @typescript-eslint/class-literal-property-style
  public readonly statusOptions = ['Active', 'Deprecated'];

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    effect(() => {
      console.log(`[Add Code Modal] Theme: ${this.theme()}`);
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToEvents();
  }

  private initForm() {
    this.codeForm = this._fb.group({
      codeValue: ['', [Validators.required, this.codeValueValidator.bind(this)]],
      label: ['', Validators.required],
      description: [''],
      status: ['Active', Validators.required],
    });
  }

  private codeValueValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const value = control.value.trim() as string;
    const type = this.codeValueType();
    const scope = this.uniquenessScope();
    const existing = this.existingCodes();

    // Type validation
    if (type === 'Integer' && !/^\d+$/.test(value)) {
      return { invalidType: 'Value must be an integer' };
    }

    if (type === 'Alphanumeric' && !/^[a-zA-Z0-9]+$/.test(value)) {
      return { invalidType: 'Value must be alphanumeric (no spaces or special characters)' };
    }

    // Uniqueness validation
    const isDuplicate = existing.some(code => code.codeValue.toLowerCase() === value.toLowerCase());

    if (isDuplicate) {
      if (scope === 'local') {
        return { duplicate: 'Code value already exists in this Code Set' };
      } else {
        return { duplicate: 'Code value already exists (globally unique constraint)' };
      }
    }

    return null;
  }

  private subscribeToEvents() {
    // Typed the NgRx select subscription to avoid 'any'
    this.eventSubs = this.eventStore.select('nf').subscribe((state: EventState) => {
      const item = state?.items;
      if (!item) return;

      const eventName = item.event;
      // Casting payload to our internal interface for type safety
      const payload = item.payload as CodeModalPayload;

      // Handle Open
      if (
        eventName === 'open_add_new_code_modal' ||
        payload?.action === 'open_add_new_code_modal'
      ) {
        if (payload?.codeSetData) {
          const data = payload.codeSetData;
          this.codeSetName.set(data.name);
          this.codeValueType.set(data.codeValueType);
          this.uniquenessScope.set(data.uniquenessScope);
          this.existingCodes.set(data.existingCodes || []);
          this.deprecatedAllowed.set(data.deprecatedAllowed);
        }

        this.theme.set(payload?.theme || this.getActiveTheme());
        this.isOpen.set(true);

        // Crucial: Reset form AFTER signals are set so validator has current context
        this.codeForm.reset({ status: 'Active' });
      }

      // Handle Close
      const closeEvents = ['close_add_mew_code_modal', 'confirmation_save_confirmed'];
      const closeActions = ['close_add_new_code_modal', 'confirmation_save_confirmed'];

      if (
        closeEvents.includes(eventName) ||
        (payload?.action && closeActions.includes(payload.action))
      ) {
        this.handleInternalClose();
      }
    });
  }

  public close() {
    this.eventService.publish('nf', 'close_add_new_code_modal', {
      action: 'close_add_new_code_modal',
      theme: this.theme(),
    });
    this.handleInternalClose();
  }

  public addCode() {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    const code: CodeEntry = {
      codeValue: (this.codeForm.get('codeValue')?.value || '').trim(),
      label: (this.codeForm.get('label')?.value || '').trim(),
      description: (this.codeForm.get('description')?.value || '').trim(),
      status: this.codeForm.get('status')?.value,
    };

    this.eventService.publish('nf', 'code_added_to_set', {
      action: 'code_added_to_set',
      code: code,
      theme: this.theme(),
    });

    console.log('[ADD CODE] Code added:', code);
    this.handleInternalClose();
  }

  private handleInternalClose() {
    this.isOpen.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.codeForm.reset({ status: 'Active' });
    this.codeSetName.set('');
    this.codeValueType.set('');
    this.uniquenessScope.set('');
    this.existingCodes.set([]);
    this.deprecatedAllowed.set(false);
  }

  public getCodeValuePlaceholder(): string {
    const type = this.codeValueType();
    switch (type) {
      case 'Integer':
        return '123';
      case 'Alphanumeric':
        return 'A1B2';
      default:
        return 'Enter code value';
    }
  }

  public getCodeValueHint(): string {
    const type = this.codeValueType();
    const scope = this.uniquenessScope();
    const scopeText = scope === 'local' ? 'within this Code Set' : 'workspace-wide';
    return `Must be a unique ${type.toLowerCase()} value ${scopeText}.`;
  }

  get availableStatuses(): string[] {
    return this.deprecatedAllowed() ? this.statusOptions : ['Active'];
  }

  public getCodeValueError(): string | null {
    const control = this.codeForm.get('codeValue');
    if (control?.hasError('required')) {
      return 'Code value is required';
    }
    if (control?.hasError('invalidType')) {
      return control.errors?.['invalidType'];
    }
    if (control?.hasError('duplicate')) {
      return control.errors?.['duplicate'];
    }
    return null;
  }

  // Changed to readonly property via getter or literal fix if preferred
  public get requiredAttributes(): string {
    const val = 'Code Value, Label';
    console.log(`Code Value ${val}`);
    return val;
  }

  private getActiveTheme(): 'light' | 'dark' {
    return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
