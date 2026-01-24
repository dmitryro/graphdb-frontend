import { Component } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: false,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  index = 0;
  btnClass: any;
  iptClass: any;

  tabChange(data: number) {
    this.index = data;
  }

  btnClickHandler() {
    if (this.btnClass) {
      this.btnClass = '';
      this.iptClass = '';
    } else {
      this.btnClass = 'close';
      this.iptClass = 'square';
    }
  }
}
