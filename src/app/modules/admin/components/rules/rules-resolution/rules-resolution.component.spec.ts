import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesResolutionComponent } from './rules-resolution.component';

describe('RulesResolutionComponent', () => {
  let component: RulesResolutionComponent;
  let fixture: ComponentFixture<RulesResolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulesResolutionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RulesResolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
