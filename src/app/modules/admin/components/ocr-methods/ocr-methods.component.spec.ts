import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OcrMethodsComponent } from "./ocr-methods.component";

describe("OcrMethodsComponent", () => {
  let component: OcrMethodsComponent;
  let fixture: ComponentFixture<OcrMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcrMethodsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OcrMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
