import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersionHistoryModalComponent } from './version-history-modal.component';

describe('VersionHistoryModalComponent', () => {
  let component: VersionHistoryModalComponent;
  let fixture: ComponentFixture<VersionHistoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersionHistoryModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VersionHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
