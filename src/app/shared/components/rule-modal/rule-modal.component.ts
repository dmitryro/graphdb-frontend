import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { ActionType } from '@modules/admin/models/action.model';
import { EventType } from '@modules/admin/models/event.model';
import { RuleSeverity, RuleType } from '@modules/admin/models/rule.model';
import { TriggerType } from '@modules/admin/models/trigger.model';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';

@Component({
  selector: 'app-rule-modal',
  standalone: false,
  templateUrl: './rule-modal.component.html',
  styleUrls: ['./rule-modal.component.scss'],
  providers: [EventService],
})
export class RuleModalComponent implements OnInit, OnDestroy {
  public isOpen = false;
  public currentAction: 'ADD' | 'EDIT' | 'DELETE' = 'ADD';
  public theme: 'light' | 'dark' = 'dark';
  private eventSubs?: Subscription;

  // Forms for each step
  identityForm!: FormGroup;
  triggerForm!: FormGroup;
  logicForm!: FormGroup;
  actionForm!: FormGroup;
  governanceForm!: FormGroup;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags: string[] = ['clinical', 'identity'];

  // Enums/Options for UI
  ruleTypes: RuleType[] = [
    'Clinical Safety' as any,
    'Data Integrity' as any,
    'Identity',
    'Validation',
    'Structural',
  ];
  severities: RuleSeverity[] = ['Critical', 'Warning', 'Info', 'Low'];
  eventTypes = Object.values(EventType);
  actionTypes = Object.values(ActionType);
  triggerTypes = Object.values(TriggerType);

  constructor(
    private fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.initForms();

    // NgRx Store Subscription handling add_rule, edit_rule, and delete_rule
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (state && state.items) {
        const itemEvent = state.items.event;
        const payload = state.items.payload;
        const itemAction = payload?.action;
        // Unified check for the three primary rule signals
        const isRuleSignal =
          ['add_rule', 'edit_rule', 'delete_rule'].includes(itemEvent) ||
          ['add_rule', 'edit_rule', 'delete_rule'].includes(itemAction);

        if (isRuleSignal) {
          this.theme = payload?.theme || 'dark';
          this.isOpen = true;

          // Determine the active mode
          if (itemEvent === 'edit_rule' || itemAction === 'edit_rule') {
            this.currentAction = 'EDIT';
          } else if (itemEvent === 'delete_rule' || itemAction === 'delete_rule') {
            this.currentAction = 'DELETE';
          } else {
            this.currentAction = 'ADD';
          }

          // If editing or deleting, patch existing data into forms for context
          if (
            (this.currentAction === 'EDIT' || this.currentAction === 'DELETE') &&
            payload.ruleData
          ) {
            this.patchExistingData(payload.ruleData);
          }
        }
      }
    });
  }

  private initForms() {
    this.identityForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      type: ['Identity', Validators.required],
      severity: ['Warning', Validators.required],
      owner: ['admin', Validators.required],
    });

    this.triggerForm = this.fb.group({
      triggerType: [[TriggerType.OnEvent], Validators.required],
      eventScope: ['Patient', Validators.required],
      sourceSystem: ['All Sources'],
    });

    this.logicForm = this.fb.group({
      logicType: ['Pattern'],
      cypherQuery: [''],
      threshold: ['> 0'],
      confidenceThreshold: [0.85],
    });

    this.actionForm = this.fb.group({
      primaryAction: [ActionType.AnnotateGraph, Validators.required],
      notificationChannel: ['InApp'],
      escalationPolicy: ['HumanReview'],
    });

    this.governanceForm = this.fb.group({
      failureMode: ['Fail Open', Validators.required],
      retentionDays: [90],
      activationMode: ['Simulation', Validators.required],
      reviewed: [false, Validators.requiredTrue],
    });
  }

  private patchExistingData(data: any) {
    if (data.identity) this.identityForm.patchValue(data.identity);
    if (data.triggers) this.triggerForm.patchValue(data.triggers);
    if (data.logic) this.logicForm.patchValue(data.logic);
    if (data.actions) this.actionForm.patchValue(data.actions);
    if (data.governance) this.governanceForm.patchValue(data.governance);
    if (data.tags) this.tags = [...data.tags];
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) this.tags.push(value);
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) this.tags.splice(index, 1);
  }

  public confirmAction() {
    const payload = {
      id: crypto.randomUUID(),
      identity: this.identityForm.value,
      triggers: this.triggerForm.value,
      logic: this.logicForm.value,
      actions: this.actionForm.value,
      governance: this.governanceForm.value,
      tags: this.tags,
      timestamp: new Date().toISOString(),
      transactionType: this.currentAction,
    };

    /**
     * TRANSACTION LOGGING TO MPI GRAPH
     * Relates transaction to specific patient golden records using
     * the mandatory execute_merge_query_with_context method.
     */
    this.eventService.publish(payload.identity.name, 'refresh_header', {
      action: this.currentAction === 'DELETE' ? 'rule_deleted' : 'rule_registration_complete',
      context: 'execute_merge_query_with_context',
      payload: payload,
    });

    this.close();
  }

  public close() {
    this.isOpen = false;
    this.tags = ['clinical', 'identity'];
    this.identityForm.reset({ type: 'Identity', severity: 'Warning', owner: 'admin' });
    this.triggerForm.reset({
      triggerType: [TriggerType.OnEvent],
      eventScope: 'Patient',
      sourceSystem: 'All Sources',
    });
    this.logicForm.reset({ logicType: 'Pattern', threshold: '> 0', confidenceThreshold: 0.85 });
    this.actionForm.reset({
      primaryAction: ActionType.AnnotateGraph,
      notificationChannel: 'InApp',
      escalationPolicy: 'HumanReview',
    });
    this.governanceForm.reset({
      failureMode: 'Fail Open',
      retentionDays: 90,
      activationMode: 'Simulation',
      reviewed: false,
    });
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
