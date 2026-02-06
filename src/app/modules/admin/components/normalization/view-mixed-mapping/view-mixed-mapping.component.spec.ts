import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMixedMappingComponent } from './view-mixed-mapping.component';

describe('ViewMixedMappingComponent', () => {
  let component: ViewMixedMappingComponent;
  let fixture: ComponentFixture<ViewMixedMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMixedMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMixedMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
