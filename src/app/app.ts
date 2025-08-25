import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ScenarioSwitcherComponent } from "./shared/components/scenario-switcher/scenario-switcher.component";

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ScenarioSwitcherComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})

export class App {
  protected readonly title = signal('financial-planner');

  constructor() {
  }
}
