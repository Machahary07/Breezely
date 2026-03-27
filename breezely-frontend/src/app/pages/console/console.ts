import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '../../../firebaseConfig';

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console.html',
  styleUrl: './console.sass'
})
export class ConsoleComponent implements OnInit {
  user: User | null = null;
  isLoading: boolean = true;
  private auth = getAuth(app);

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Only run Firebase Auth checks safely in the browser, not during Angular SSR
    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(this.auth, (currentUser) => {
        if (currentUser) {
          this.user = currentUser;
        } else {
          // Redirect to signin if not signed in
          this.router.navigate(['/signin']);
        }
        this.isLoading = false;
        // Force the view to update (solves async zone lost contexts)
        this.cdr.detectChanges();
      });
    } else {
      // Server-side default state
      this.isLoading = true;
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      signOut(this.auth).then(() => {
        this.router.navigate(['/signin']);
      });
    }
  }
}
