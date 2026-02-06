import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCodeSetMappingComponent } from './edit-code-set-mapping.component';

describe('EditCodeSetMappingComponent', () => {
  let component: EditCodeSetMappingComponent;
  let fixture: ComponentFixture<EditCodeSetMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCodeSetMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCodeSetMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
