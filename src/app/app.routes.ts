import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard.component';
import { IncomeComponent } from './components/income.component';
import { ExpensesComponent } from './components/expenses.component';
import { InvestmentsComponent } from './components/investments.component';
import { LiabilitiesComponent } from './components/liabilities.component';
import { SwpPlanComponent } from './components/swp/swp-plan.component';

export const routes: Routes = [
	{ path: '', component: SwpPlanComponent, pathMatch: 'full'},
	{ path: 'dashboard', component: DashboardComponent },
	{ path: 'income', component: IncomeComponent },
	{ path: 'expenses', component: ExpensesComponent },
	{ path: 'investments', component: InvestmentsComponent },
	{ path: 'liabilities', component: LiabilitiesComponent },
	{ path: 'swp-plan', component: SwpPlanComponent },
];
