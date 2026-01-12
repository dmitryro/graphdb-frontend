import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizationModalComponent } from './normalization-modal.component';

describe('NormalizationModalComponent', () => {
  let component: NormalizationModalComponent;
  let fixture: ComponentFixture<NormalizationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NormalizationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NormalizationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
