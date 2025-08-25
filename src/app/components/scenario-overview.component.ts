import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Income, Expense, Investment, Liability, SWPPlan } from '../shared/services/finance-planner.service';
import { Scenario } from '../shared/models/scenario.model';

@Component({
  selector: 'app-scenario-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenario-overview.component.html',
})
export class ScenarioOverviewComponent implements OnInit {
  incomes: Income[] = [];
  expenses: Expense[] = [];
  investments: Investment[] = [];
  liabilities: Liability[] = [];
  swpPlan: SWPPlan | null = null;
  scenarios: Scenario[] = [];

  constructor(private financeService: FinancePlannerService) { }

  ngOnInit(): void {
    this.financeService.scenarios$.subscribe(s => {
      this.scenarios = s;
    });

    this.financeService.activeScenarioId$.subscribe(id => {
      const activeScenario = this.scenarios.find(s => s.id === id) || null;

      if (activeScenario) {
        this.incomes = activeScenario.incomes || [];
        this.expenses = activeScenario.expenses || [];
        this.investments = activeScenario.investments || [];
        this.liabilities = activeScenario.liabilities || [];
        this.swpPlan = activeScenario.swpPlan || null;
      }
    });
  }

  getMonthlyExpenseTotal(): number {
    return this.expenses.reduce((sum, e) => sum + (e.type === 'Monthly' ? e.amount : e.amount / 12), 0);
  }
}
