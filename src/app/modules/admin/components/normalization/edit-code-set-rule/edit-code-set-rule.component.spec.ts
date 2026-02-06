import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCodeSetRuleComponent } from './edit-code-set-rule.component';

describe('EditCodeSetRuleComponent', () => {
  let component: EditCodeSetRuleComponent;
  let fixture: ComponentFixture<EditCodeSetRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCodeSetRuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCodeSetRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
