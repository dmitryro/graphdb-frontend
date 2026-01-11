import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-source-modal',
  standalone: false,
  templateUrl: './source-modal.component.html',
  styleUrls: ['./source-modal.component.scss'],
  providers: [EventService],
})
export class SourceModalComponent implements OnInit, OnDestroy {
  public isOpen = false;
  public currentAction = '';
  public isTesting = false;
  public connectionStatus: 'idle' | 'success' | 'error' = 'idle';
  public theme: 'light' | 'dark' = 'light';
  private eventSubs?: Subscription;

  identityForm!: FormGroup;
  connectivityForm!: FormGroup;
  securityForm!: FormGroup;
  semanticsForm!: FormGroup;
  governanceForm!: FormGroup;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags: string[] = ['clinical', 'authoritative'];

  categories = [
    'Medical Standard (FHIR, HL7)',
    'Database (SQL/NoSQL)',
    'Streaming',
    'File Storage',
    'API',
    'Retail',
    'Research',
  ];
  trustIntents = ['Authoritative', 'Corroborating', 'Observational'];

  sourceTypes = [
    {
      group: 'Healthcare Standards',
      types: [
        'FHIR R4 Server',
        'FHIR R5 Server',
        'SMART on FHIR',
        'HL7 v2.x (MLLP)',
        'HL7 v3',
        'C-CDA',
        'X12 837 (Claims)',
      ],
    },
    {
      group: 'Databases',
      types: [
        'PostgreSQL',
        'MySQL',
        'SQL Server',
        'Neo4j',
        'Memgraph',
        'TigerGraph',
        'MongoDB',
        'DynamoDB',
        'Cassandra',
      ],
    },
    {
      group: 'Streaming & Messaging',
      types: ['Kafka', 'Redpanda', 'Pulsar', 'RabbitMQ', 'AWS Kinesis', 'GCP Pub/Sub'],
    },
    {
      group: 'Object & File Storage',
      types: [
        'Amazon S3',
        'Google Cloud Storage',
        'Azure Blob',
        'SFTP',
        'MinIO',
        'Parquet',
        'Avro',
      ],
    },
    { group: 'APIs & Services', types: ['REST API', 'GraphQL', 'gRPC', 'SOAP'] },
    {
      group: 'Retail & IoT',
      types: ['Apple Health', 'Google Fit', 'Fitbit', 'RPM Devices', 'Pharmacy Systems'],
    },
  ];

  @ViewChild('modalContainer') modalContainer?: ElementRef;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (state && state.items) {
        const itemEvent = state.items.event;
        const payload = state.items.payload;
        const itemAction = payload?.action;

        if (
          itemEvent === 'add_source' ||
          itemAction === 'add_source' ||
          itemAction === 'edit_source'
        ) {
          this.theme = payload?.theme || 'light';
          this.isOpen = true;
          this.currentAction = itemAction === 'edit_source' ? 'EDIT' : 'ADD';
        }
      }
    });
  }

  private initForms() {
    this.identityForm = this._fb.group({
      name: ['', Validators.required],
      description: [''],
      owner: ['', Validators.required],
      env: ['prod', Validators.required],
      category: ['Medical Standard (FHIR, HL7)', Validators.required],
      intent: ['Authoritative', Validators.required],
    });

    this.connectivityForm = this._fb.group({
      type: ['FHIR R4 Server', Validators.required],
      protocol: ['https', Validators.required],
      host: ['', Validators.required],
      port: [''],
      path: [''],
      mode: ['Stream'],
    });

    this.securityForm = this._fb.group({
      authType: ['OAuth2', Validators.required],
      vaultRef: ['', Validators.required],
      rotation: ['90 Days'],
      tlsEnforced: [true],
    });

    this.semanticsForm = this._fb.group({
      format: ['JSON', Validators.required],
      strategy: ['Auto-discover'],
      identityMatch: ['Fuzzy', Validators.required],
    });

    this.governanceForm = this._fb.group({
      ingestion: ['Continuous'],
      compliance: ['HIPAA'],
      activate: [false, Validators.requiredTrue],
    });
  }

  public testConnection() {
    this.isTesting = true;
    this.connectionStatus = 'idle';

    setTimeout(() => {
      this.isTesting = false;
      const host = this.connectivityForm.get('host')?.value;
      this.connectionStatus = host && host.length > 2 ? 'success' : 'error';
      this.connectivityForm.updateValueAndValidity();
    }, 1200);
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

  public close() {
    this.isOpen = false;
    this.connectionStatus = 'idle';
    this.identityForm.reset({
      env: 'prod',
      category: 'Medical Standard (FHIR, HL7)',
      intent: 'Authoritative',
    });
    this.connectivityForm.reset({ protocol: 'https', mode: 'Stream', type: 'FHIR R4 Server' });
    this.securityForm.reset({ authType: 'OAuth2', rotation: '90 Days', tlsEnforced: true });
    this.semanticsForm.reset({ format: 'JSON', strategy: 'Auto-discover', identityMatch: 'Fuzzy' });
    this.governanceForm.reset({ ingestion: 'Continuous', compliance: 'HIPAA', activate: false });
  }

  public confirmAction() {
    const payload = {
      identity: this.identityForm.value,
      connectivity: this.connectivityForm.value,
      security: this.securityForm.value,
      semantics: this.semanticsForm.value,
      governance: this.governanceForm.value,
      tags: this.tags,
      timestamp: new Date().toISOString(),
    };

    this.eventService.publish(payload.identity.name, 'refresh_header', {
      action: 'source_registration_complete',
      context: 'execute_merge_query_with_context',
      payload: payload,
    });

    this.close();
  }

  ngOnDestroy(): void {
    if (this.eventSubs) this.eventSubs.unsubscribe();
  }
}
