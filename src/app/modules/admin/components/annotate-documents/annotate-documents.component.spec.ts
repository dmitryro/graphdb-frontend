import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotateDocumentsComponent } from './annotate-documents.component';

describe('AnnotateDocumentsComponent', () => {
  let component: AnnotateDocumentsComponent;
  let fixture: ComponentFixture<AnnotateDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotateDocumentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnotateDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
