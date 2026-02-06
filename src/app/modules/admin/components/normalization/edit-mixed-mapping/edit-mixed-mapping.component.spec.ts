import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMixedMappingComponent } from './edit-mixed-mapping.component';

describe('EditMixedMappingComponent', () => {
  let component: EditMixedMappingComponent;
  let fixture: ComponentFixture<EditMixedMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMixedMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMixedMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
