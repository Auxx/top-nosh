import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeManagerService } from '../settings/services/theme-manager/theme-manager.service';
import { StartupService } from '../system/services/startup/startup.service';

@Component({
  imports: [ RouterModule ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    inject(StartupService);
    inject(ThemeManagerService);
  }
}
