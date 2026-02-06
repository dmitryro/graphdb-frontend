import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCodeSetMappingComponent } from './view-code-set-mapping.component';

describe('ViewCodeSetMappingComponent', () => {
  let component: ViewCodeSetMappingComponent;
  let fixture: ComponentFixture<ViewCodeSetMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewCodeSetMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewCodeSetMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
