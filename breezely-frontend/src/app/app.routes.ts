import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AuthComponent } from './pages/auth/auth';
import { ConsoleComponent } from './pages/console/console';
import { StatusComponent } from './pages/status/status';
import { ComingSoonComponent } from './pages/coming-soon/coming-soon';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) 
  },
  { 
    path: 'signin', 
    loadComponent: () => import('./pages/auth/auth').then(m => m.AuthComponent) 
  },
  { 
    path: 'console', 
    loadComponent: () => import('./pages/console/console').then(m => m.ConsoleComponent) 
  },
  { 
    path: 'status', 
    loadComponent: () => import('./pages/status/status').then(m => m.StatusComponent) 
  },
  { 
    path: 'coming-soon', 
    loadComponent: () => import('./pages/coming-soon/coming-soon').then(m => m.ComingSoonComponent) 
  },
  { path: '**', redirectTo: 'coming-soon' }
];
