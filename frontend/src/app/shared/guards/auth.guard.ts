import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    const user = this.authService.user();
    if (!user) return true;
    
    // Prüfe Gruppe
    if (user.groups && Array.isArray(user.groups) && user.groups.includes('productmanager')) {
      this.router.navigate(['/product-management']);
      return false;
    }
    
    // Fallback: Prüfe Username (falls Gruppe nicht gesetzt ist)
    if (user.username && user.username.toLowerCase() === 'productmanager') {
      this.router.navigate(['/product-management']);
      return false;
    }
    
    // For other users or not logged in, allow access to product-list
    return true;
  }
}
