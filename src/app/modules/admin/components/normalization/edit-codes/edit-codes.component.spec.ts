import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCodesComponent } from './edit-codes.component';

describe('EditCodesComponent', () => {
  let component: EditCodesComponent;
  let fixture: ComponentFixture<EditCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCodesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
