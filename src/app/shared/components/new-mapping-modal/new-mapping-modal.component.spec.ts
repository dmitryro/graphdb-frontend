import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMappingModalComponent } from './new-mapping-modal.component';

describe('NewMappingModalComponent', () => {
  let component: NewMappingModalComponent;
  let fixture: ComponentFixture<NewMappingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMappingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewMappingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
