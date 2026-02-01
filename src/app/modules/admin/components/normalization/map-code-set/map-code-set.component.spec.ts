import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapCodeSetComponent } from './map-code-set.component';

describe('MapCodeSetComponent', () => {
  let component: MapCodeSetComponent;
  let fixture: ComponentFixture<MapCodeSetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapCodeSetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapCodeSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
