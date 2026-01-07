import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DocumentTaggingComponent } from "./document-tagging.component";

describe("DocumentTaggingComponent", () => {
  let component: DocumentTaggingComponent;
  let fixture: ComponentFixture<DocumentTaggingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTaggingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentTaggingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
