import { Component, OnInit } from '@angular/core';
import { FinancePlannerService } from '../../../shared/services/finance-planner.service';
import { Scenario } from '../../models/scenario.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-scenario-switcher',
    templateUrl: './scenario-switcher.component.html',
    styleUrls: ['./scenario-switcher.component.css'],
    imports: [CommonModule, FormsModule],
})
export class ScenarioSwitcherComponent implements OnInit {
    scenarios: Scenario[] = [];
    activeScenario: Scenario | null = null;

    newScenarioName: string = '';

    isDropdownOpen = false;
    editingScenarioId: string | null = null;
    editedName: string = '';

    constructor(private financeService: FinancePlannerService) { }

    ngOnInit(): void {
        this.financeService.scenarios$.subscribe(s => {
            this.scenarios = s;
        });

        this.financeService.activeScenarioId$.subscribe(id => {
            this.activeScenario = this.scenarios.find(s => s.id === id) || null;
        });
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    selectScenario(scenario: Scenario) {
        this.financeService.setActiveScenario(scenario.id);
        this.isDropdownOpen = false;
    }

    startEditing(scenario: Scenario, event?: MouseEvent) {
        event?.stopPropagation();
        this.editingScenarioId = this.editingScenarioId ? null : scenario.id;
        this.editedName = scenario.name;
    }

    saveEditedName(scenario: Scenario) {
        if (this.editedName.trim() && this.editedName !== scenario.name) {
            this.financeService.renameScenario(scenario.id, this.editedName.trim());
        }
        this.editingScenarioId = null;
    }

    cancelEdit() {
        this.editingScenarioId = null;
    }

    deleteScenario(scenario: Scenario, event?: MouseEvent) {
        event?.stopPropagation();
        if (scenario.id !== 'baseline') {
            this.financeService.deleteScenario(scenario.id);
        }
    }

    createScenario() {
        const name = this.newScenarioName;
        if (name?.trim()) {
            this.financeService.createScenario(name.trim());
            this.newScenarioName = '';
        }
    }
}
