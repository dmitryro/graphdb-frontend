import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-nav',
  standalone: false,
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent implements OnInit {
  @Output() sideNavToggled = new EventEmitter<void>();
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;
  searchTerm = '';
  isSearchFocused = false;

  constructor(private readonly router: Router) {}

  ngOnInit() {
    // Lifecycle hook kept for future initialization logic
  }

  toggleSidebar() {
    this.sideNavToggled.emit();
  }

  onFocus() {
    this.isSearchFocused = true;
  }

  onBlur() {
    this.isSearchFocused = false;
  }

  onSearchClick() {
    console.log('Search term:', this.searchTerm);
    // MPI Transaction logging or navigation logic goes here
  }

  onLoggedout() {
    localStorage.removeItem('isLoggedin');
    this.router.navigate(['/login']);
  }

  onInput() {
    this.searchTerm = this.searchInput.nativeElement.value;
  }
}
