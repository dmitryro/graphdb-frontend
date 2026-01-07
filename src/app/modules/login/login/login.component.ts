import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-login",
  standalone: false,
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {}

  onLogin() {
    localStorage.setItem("isLoggedin", "true");
    // Updated redirect to match the new flat 'overview' route
    this.router.navigate(["/overview"]);
  }
}