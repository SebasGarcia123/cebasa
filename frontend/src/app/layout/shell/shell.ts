import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth/auth.service';
import { ReclamosApiService } from '../../core/api/reclamos-api.service';
import { NAV_GROUPS } from '../nav-groups';

const RECLAMOS_ROUTE = '/comercial/reclamos';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly reclamosApi = inject(ReclamosApiService);

  protected readonly navGroups = NAV_GROUPS;
  protected readonly reclamosRoute = RECLAMOS_ROUTE;
  protected readonly reclamosPendientes = this.reclamosApi.pendientesCount;
  protected readonly user = this.authService.currentUser;
  protected readonly darkMode = signal(false);

  ngOnInit(): void {
    this.reclamosApi.refreshPendientesCount();
  }

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
