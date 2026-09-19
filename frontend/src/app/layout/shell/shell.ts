import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth/auth.service';
import { NAV_GROUPS } from '../nav-groups';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navGroups = NAV_GROUPS;
  protected readonly user = this.authService.currentUser;
  protected readonly darkMode = signal(false);

  toggleDarkMode(): void {
    this.darkMode.update((value) => !value);
    document.documentElement.dataset['theme'] = this.darkMode() ? 'dark' : 'light';
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/login']);
    });
  }
}
