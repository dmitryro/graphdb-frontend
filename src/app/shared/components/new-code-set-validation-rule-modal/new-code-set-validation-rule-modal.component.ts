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
  selector: 'app-new-code-set-validation-rule-modal',
  standalone: false,
  templateUrl: './new-code-set-validation-rule-modal.component.html',
  styleUrl: './new-code-set-validation-rule-modal.component.scss',
  providers: [EventService],
})
export class NewCodeSetValidationRuleModalComponent implements OnInit, OnDestroy {
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
  ruleForm!: FormGroup;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    effect(() => {
      console.log(`[Add Code Validation Rule Modal] Theme: ${this.theme()}`);
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToEvents();
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

  private initForm() {
    this.ruleForm = this._fb.group({
      codeValue: ['', [Validators.required, this.codeValueValidator.bind(this)]],
      label: ['', Validators.required],
      description: [''],
      status: ['Active', Validators.required],
    });
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
        eventName === 'open_new_code_set_validation_rule_modal' ||
        payload?.action === 'open_new_code_set_validation_rule_modal'
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
        this.ruleForm.reset({ status: 'Active' });
      }

      // Handle Close
      const closeEvents = [
        'close_new_code_set_validation_rule_modal',
        'confirmation_save_confirmed',
      ];
      const closeActions = [
        'close_new_code_set_validation_rule_modal',
        'confirmation_save_confirmed',
      ];

      if (
        closeEvents.includes(eventName) ||
        (payload?.action && closeActions.includes(payload.action))
      ) {
        this.handleInternalClose();
      }
    });
  }

  public close() {
    this.eventService.publish('nf', 'close_new_code_set_validation_rule_modal', {
      action: 'close_new_code_set_validation_rule_modal',
      theme: this.theme(),
    });
    this.handleInternalClose();
  }

  private handleInternalClose() {
    this.isOpen.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.ruleForm.reset({ status: 'Active' });
    this.codeSetName.set('');
    this.codeValueType.set('');
    this.uniquenessScope.set('');
    this.existingCodes.set([]);
    this.deprecatedAllowed.set(false);
  }

  public addValidationRule() {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const code: CodeEntry = {
      codeValue: (this.ruleForm.get('codeValue')?.value || '').trim(),
      label: (this.ruleForm.get('label')?.value || '').trim(),
      description: (this.ruleForm.get('description')?.value || '').trim(),
      status: this.ruleForm.get('status')?.value,
    };

    this.eventService.publish('nf', 'code_set_validation_rule_added', {
      action: 'code_set_validation_rule_added',
      code: code,
      theme: this.theme(),
    });

    console.log('[ADD CODE SET MAPPING] Code set mapping added:', code);
    this.handleInternalClose();
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
