import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCodeSetMappingModalComponent } from './new-code-set-mapping-modal.component';

describe('NewCodeSetMappingModalComponent', () => {
  let component: NewCodeSetMappingModalComponent;
  let fixture: ComponentFixture<NewCodeSetMappingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCodeSetMappingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCodeSetMappingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
