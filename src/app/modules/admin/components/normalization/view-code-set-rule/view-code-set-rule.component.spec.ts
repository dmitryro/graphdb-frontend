import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCodeSetRuleComponent } from './view-code-set-rule.component';

describe('ViewCodeSetRuleComponent', () => {
  let component: ViewCodeSetRuleComponent;
  let fixture: ComponentFixture<ViewCodeSetRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewCodeSetRuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewCodeSetRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
