import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDocumentsComponent } from "./edit-documents.component";

describe("EditDocumentsComponent", () => {
  let component: EditDocumentsComponent;
  let fixture: ComponentFixture<EditDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDocumentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
