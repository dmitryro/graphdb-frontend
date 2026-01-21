import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageImpactDrawerComponent } from './usage-impact-drawer.component';

describe('UsageImpactDrawerComponent', () => {
  let component: UsageImpactDrawerComponent;
  let fixture: ComponentFixture<UsageImpactDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageImpactDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageImpactDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
