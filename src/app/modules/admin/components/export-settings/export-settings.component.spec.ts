import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExportSettingsComponent } from "./export-settings.component";

describe("ExportSettingsComponent", () => {
  let component: ExportSettingsComponent;
  let fixture: ComponentFixture<ExportSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
