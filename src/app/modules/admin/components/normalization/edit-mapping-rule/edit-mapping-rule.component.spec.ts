import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMappingRuleComponent } from './edit-mapping-rule.component';

describe('EditMappingRuleComponent', () => {
  let component: EditMappingRuleComponent;
  let fixture: ComponentFixture<EditMappingRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMappingRuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMappingRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
