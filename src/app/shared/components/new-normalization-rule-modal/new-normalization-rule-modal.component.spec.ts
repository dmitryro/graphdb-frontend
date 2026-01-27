import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewNormalizationRuleModalComponent } from './new-normalization-rule-modal.component';

describe('NewNormalizationRuleModalComponent', () => {
  let component: NewNormalizationRuleModalComponent;
  let fixture: ComponentFixture<NewNormalizationRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewNormalizationRuleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewNormalizationRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
