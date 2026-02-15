import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleAssemblerComponent } from './rule-assembler.component';

describe('RuleAssemblerComponent', () => {
  let component: RuleAssemblerComponent;
  let fixture: ComponentFixture<RuleAssemblerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleAssemblerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleAssemblerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
