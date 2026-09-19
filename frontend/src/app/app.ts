import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Cebasa');
  protected readonly darkMode = signal(false);

  toggleDarkMode(): void {
    this.darkMode.update((value) => !value);
    document.documentElement.dataset['theme'] = this.darkMode() ? 'dark' : 'light';
  }
}
