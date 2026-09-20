import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

  protected readonly navGroups = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }
    if (user.es_administrador) {
      return NAV_GROUPS;
    }

    const permisos = new Set(user.permisos);
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || permisos.has(item.permission)),
    })).filter((group) => group.items.length > 0);
  });

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
