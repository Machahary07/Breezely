import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, fetchSignInMethodsForEmail, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../firebaseConfig';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.sass'
})
export class AuthComponent implements OnInit {
  email: string = '';
  
  step: 'email' | 'link-sent' = 'email';
  isLoading: boolean = false;
  message: string = '';
  isError: boolean = false;

  private auth = getAuth(app);

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Ensure this runs only in the browser, not during Angular SSR
    if (isPlatformBrowser(this.platformId)) {
      this.isLoading = true;
      this.cdr.detectChanges();

      const unsubscribe = onAuthStateChanged(this.auth, async (currentUser) => {
        if (currentUser) {
          this.router.navigate(['/console']);
        } else {
          // Not logged in automatically. Check if returning from a magic link.
          if (isSignInWithEmailLink(this.auth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            
            if (!emailForSignIn) {
              emailForSignIn = window.prompt('Please provide your email for confirmation');
            }

            if (emailForSignIn) {
              this.showMessage('Authenticating Magic Link...', false);
              this.cdr.detectChanges();
              try {
                await signInWithEmailLink(this.auth, emailForSignIn, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                this.showMessage('Success! Rerouting...', false);
                // onAuthStateChanged will fire again with currentUser, triggering navigation
              } catch (error: any) {
                this.showMessage(error.message || 'Error executing magic link.', true);
                this.isLoading = false;
                this.step = 'email'; // revert to default
                this.cdr.detectChanges();
              }
            } else {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          } else {
            // Normal visit to sign in page
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  async sendMagicLink() {
    if (!this.email || !this.email.includes('@')) {
      this.showMessage('Please enter a valid email address.', true);
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.showMessage('Verifying...', false);
    this.cdr.detectChanges();

    try {
      // 1. Check if the email already belongs to a Google Auth user
      const methods = await fetchSignInMethodsForEmail(this.auth, this.email);

      if (methods.includes('google.com')) {
        this.isLoading = false;
        this.showMessage('Account exists! Please select "Continue with Google" above to login securely.', false);
        this.cdr.detectChanges();
        return;
      }

      // 2. Either no account exists, or it uses normal email auth. Generate Link.
      this.showMessage('Generating Magic Link...', false);
      this.cdr.detectChanges();

      const actionCodeSettings = {
        // URL you want to redirect back to.
        url: window.location.href, 
        handleCodeInApp: true
      };

      await sendSignInLinkToEmail(this.auth, this.email, actionCodeSettings);
      
      // Save locally to help complete login on same device
      window.localStorage.setItem('emailForSignIn', this.email);
      
      this.step = 'link-sent';
      this.isLoading = false;
      this.showMessage('', false);
      this.cdr.detectChanges();
    } catch (error: any) {
      this.showMessage(error.message || 'Error processing email.', true);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async continueWithGoogle() {
    const provider = new GoogleAuthProvider();
    this.isLoading = true;
    this.showMessage('Opening Google Secure Login...', false);
    
    try {
      await signInWithPopup(this.auth, provider);
      this.showMessage('Success! Redirecting...', false);
      this.router.navigate(['/console']);
    } catch (error: any) {
      this.showMessage(error.message || 'Google Sign-In failed.', true);
      this.isLoading = false;
    }
  }

  showMessage(msg: string, isErr: boolean) {
    this.message = msg;
    this.isError = isErr;
  }
}
