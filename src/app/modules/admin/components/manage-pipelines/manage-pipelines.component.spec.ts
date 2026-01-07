import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ManagePipelinesComponent } from "./manage-pipelines.component";

describe("ManagePipelinesComponent", () => {
  let component: ManagePipelinesComponent;
  let fixture: ComponentFixture<ManagePipelinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePipelinesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagePipelinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
