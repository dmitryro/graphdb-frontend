import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCodeSetModalComponent } from './new-code-set-modal.component';

describe('NewCodeSetModalComponent', () => {
  let component: NewCodeSetModalComponent;
  let fixture: ComponentFixture<NewCodeSetModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCodeSetModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCodeSetModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
