import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCodeSetValidationRuleModalComponent } from './new-code-set-validation-rule-modal.component';

describe('NewCodeSetValidationRuleModalComponent', () => {
  let component: NewCodeSetValidationRuleModalComponent;
  let fixture: ComponentFixture<NewCodeSetValidationRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCodeSetValidationRuleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCodeSetValidationRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
