import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriftComponent } from './drift.component';

describe('DriftComponent', () => {
  let component: DriftComponent;
  let fixture: ComponentFixture<DriftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriftComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DriftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
