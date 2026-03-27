import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AuthComponent } from './pages/auth/auth';
import { ConsoleComponent } from './pages/console/console';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signin', component: AuthComponent },
  { path: 'console', component: ConsoleComponent },
  { path: '**', redirectTo: '' }
];
