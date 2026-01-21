import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMappingComponent } from './view-mapping.component';

describe('ViewMappingComponent', () => {
  let component: ViewMappingComponent;
  let fixture: ComponentFixture<ViewMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
