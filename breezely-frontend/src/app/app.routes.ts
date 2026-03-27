import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AuthComponent } from './pages/auth/auth';
import { ConsoleComponent } from './pages/console/console';
import { StatusComponent } from './pages/status/status';
import { ComingSoonComponent } from './pages/coming-soon/coming-soon';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signin', component: AuthComponent },
  { path: 'console', component: ConsoleComponent },
  { path: 'status', component: StatusComponent },
  { path: 'coming-soon', component: ComingSoonComponent },
  { path: '**', redirectTo: 'coming-soon' }
];
