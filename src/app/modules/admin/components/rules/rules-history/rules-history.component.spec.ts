import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesHistoryComponent } from './rules-history.component';

describe('RulesHistoryComponent', () => {
  let component: RulesHistoryComponent;
  let fixture: ComponentFixture<RulesHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulesHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RulesHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
