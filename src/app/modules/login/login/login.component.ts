import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  // credential can now hold either the username or the email address
  loginData = {
    credential: '',
    password: '',
  };

  constructor(private router: Router) {
    // Constructor logic will come here
  }

  ngOnInit() {
    // Login Initialization Logic will come here.
    console.log('Login initialized');
  }

  onLogin() {
    // Basic check to ensure credentials exist before setting login state
    if (this.loginData.credential && this.loginData.password) {
      localStorage.setItem('isLoggedin', 'true');
      this.router.navigate(['/overview']);
    }
  }

  onRegister() {
    this.router.navigate(['/register']);
  }
}
