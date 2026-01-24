import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineRunsComponent } from './pipeline-runs.component';

describe('PipelineRunsComponent', () => {
  let component: PipelineRunsComponent;
  let fixture: ComponentFixture<PipelineRunsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipelineRunsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PipelineRunsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
