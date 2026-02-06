import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMappingRuleComponent } from './view-mapping-rule.component';

describe('ViewMappingRuleComponent', () => {
  let component: ViewMappingRuleComponent;
  let fixture: ComponentFixture<ViewMappingRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMappingRuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMappingRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
