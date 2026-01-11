import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
})
export class RegistrationComponent implements OnInit, OnDestroy {
  identityFormGroup!: FormGroup;
  purposeFormGroup!: FormGroup;

  hidePassword = true;
  passwordStrength = 0;
  strengthLabel = '';
  strengthColor: 'warn' | 'accent' | 'primary' = 'warn';

  resendCooldown = 60;
  countdownDisplay = 60;
  canResend = false;
  private timerSubscription?: Subscription;

  purposeOptions = [
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'learning', label: 'Learning & Research' },
    { value: 'medical_pipeline', label: 'Medical Data Pipeline' },
    { value: 'data_pipeline', label: 'General Data Pipeline' },
    { value: 'infrastructure', label: 'Infrastructure & Integration' },
  ];

  mockConsentText = `By checking the box below, you agree to the LINTYL Data Processing Agreement and Privacy Policy. 
  You acknowledge that any medical data processed through our pipelines is subject to the compliance standards 
  (such as HIPAA or GDPR) configured within your specific workspace environment. 
  
  LINTYL collects technical metadata and transaction logs to maintain the graph of events and ensure 
  traceability of all record changes. Your business contact information, including email and phone number, 
  will be used for account security, multi-factor authentication, and critical system notifications. 
  
  We do not sell your personal data. For users operating within a medical pipeline, you certify that 
  you have obtained necessary patient consent before utilizing the Golden Record resolution features. 
  Failure to comply with data governance policies may result in account suspension.`;

  constructor(
    private _formBuilder: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit() {
    this.identityFormGroup = this._formBuilder.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        company: ['', Validators.required],
        username: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );

    this.purposeFormGroup = this._formBuilder.group({
      purpose: ['', Validators.required],
      consent: [false, Validators.requiredTrue],
    });

    this.identityFormGroup.get('password')?.valueChanges.subscribe(val => {
      this.calculatePasswordStrength(val);
    });
  }

  private calculatePasswordStrength(password: string) {
    let score = 0;
    if (!password) {
      this.passwordStrength = 0;
      this.strengthLabel = '';
      return;
    }
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    this.passwordStrength = score;
    if (score <= 25) {
      this.strengthLabel = 'Weak';
      this.strengthColor = 'warn';
    } else if (score <= 75) {
      this.strengthLabel = 'Medium';
      this.strengthColor = 'accent';
    } else {
      this.strengthLabel = 'Strong';
      this.strengthColor = 'primary';
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onRegister() {
    if (this.identityFormGroup.valid && this.purposeFormGroup.valid) {
      this.startCountdown();
    }
  }

  resendEmail() {
    if (!this.canResend) return;
    this.startCountdown();
  }

  private startCountdown() {
    this.canResend = false;
    this.countdownDisplay = this.resendCooldown;
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000)
      .pipe(take(this.resendCooldown))
      .subscribe({
        next: val => {
          this.countdownDisplay = this.resendCooldown - 1 - val;
        },
        complete: () => {
          this.canResend = true;
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
  }
}
