import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotTimelineComponent } from './snapshot-timeline.component';

describe('SnapshotTimelineComponent', () => {
  let component: SnapshotTimelineComponent;
  let fixture: ComponentFixture<SnapshotTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotTimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
