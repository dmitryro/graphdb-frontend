import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleModalComponent } from './rule-modal.component';

describe('RuleModalComponent', () => {
  let component: RuleModalComponent;
  let fixture: ComponentFixture<RuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
