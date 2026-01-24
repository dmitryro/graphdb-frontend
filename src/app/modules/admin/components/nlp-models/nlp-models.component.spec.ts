import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NlpModelsComponent } from './nlp-models.component';

describe('NlpModelsComponent', () => {
  let component: NlpModelsComponent;
  let fixture: ComponentFixture<NlpModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NlpModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NlpModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
