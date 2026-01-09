import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesConflictsComponent } from './rules-conflicts.component';

describe('RulesConflictsComponent', () => {
  let component: RulesConflictsComponent;
  let fixture: ComponentFixture<RulesConflictsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulesConflictsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RulesConflictsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
