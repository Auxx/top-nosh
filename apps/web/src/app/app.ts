import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeManagerService } from '../settings/services/theme-manager/theme-manager.service';

@Component({
  imports: [ RouterModule ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    inject(ThemeManagerService);
  }
}
