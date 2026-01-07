import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExportCenterComponent } from "./export-center.component";

describe("ExportCenterComponent", () => {
  let component: ExportCenterComponent;
  let fixture: ComponentFixture<ExportCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportCenterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
