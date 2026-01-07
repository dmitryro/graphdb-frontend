import { Injectable } from "@angular/core";

@Injectable()
export class ModalHelperService {
  isAllSelected(selection: any, dataSource: any) {
    const numSelected: number = selection.selected.length;
    const numRows: number = dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(selection: any, dataSource: any) {
    this.isAllSelected(selection, dataSource)
      ? selection.clear()
      : dataSource.data.forEach((row) => selection.select(row));
  }

  filter() {
    console.log("filtering ....");
  }

  sort() {
    console.log("sorting ....");
  }

  save() {
    console.log("Saving....");
  }
}
