import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewCodeModalComponent } from './add-new-code-modal.component';

describe('AddNewCodeModalComponent', () => {
  let component: AddNewCodeModalComponent;
  let fixture: ComponentFixture<AddNewCodeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewCodeModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddNewCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
