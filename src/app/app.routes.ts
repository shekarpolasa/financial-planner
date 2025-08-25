import { Routes } from '@angular/router';
import { IncomeComponent } from './components/income.component';
import { ExpensesComponent } from './components/expenses.component';
import { InvestmentsComponent } from './components/investments.component';
import { LiabilitiesComponent } from './components/liabilities.component';
import { SwpPlanComponent } from './components/swp/swp-plan.component';
import { XirrFormComponent } from './components/calculators/xirr/xirr.component';
import { ScenarioOverviewComponent } from './components/scenario-overview.component';

export const routes: Routes = [
	{ path: '', component: SwpPlanComponent, pathMatch: 'full' },
	{ path: 'overview', component: ScenarioOverviewComponent },
	{ path: 'income', component: IncomeComponent },
	{ path: 'expenses', component: ExpensesComponent },
	{ path: 'investments', component: InvestmentsComponent },
	{ path: 'liabilities', component: LiabilitiesComponent },

	// Calculators
	{ path: 'calculators/xirr', component: XirrFormComponent },
	{ path: '**', redirectTo: '' }
];
