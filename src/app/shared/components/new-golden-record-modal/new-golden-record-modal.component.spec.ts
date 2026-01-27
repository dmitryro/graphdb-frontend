import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGoldenRecordModalComponent } from './new-golden-record-modal.component';

describe('NewGoldenRecordModalComponent', () => {
  let component: NewGoldenRecordModalComponent;
  let fixture: ComponentFixture<NewGoldenRecordModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGoldenRecordModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewGoldenRecordModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
