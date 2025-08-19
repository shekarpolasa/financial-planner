import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <h2>Dashboard</h2>
      <p><strong>Net Worth:</strong> ₹{{ netWorth }}</p>
      <p><strong>Total Income:</strong> ₹{{ totalIncome }}</p>
      <p><strong>Total Investments:</strong> ₹{{ totalInvestments }}</p>
      <p><strong>Total Expenses:</strong> ₹{{ totalExpenses }}</p>
      <p><strong>Total Liabilities:</strong> ₹{{ totalLiabilities }}</p>
    </div>
  `
})
export class DashboardComponent {
  @Input() data: any;
  @Input() netWorth: number = 0;

  get totalIncome(): number {
    return this.data?.incomes?.reduce((sum: number, inc: any) => sum + (+inc.amount || 0), 0) || 0;
  }

  get totalInvestments(): number {
    return this.data?.investments?.reduce((sum: number, inv: any) => sum + (+inv.amount || 0), 0) || 0;
  }

  get totalExpenses(): number {
    return this.data?.expenses?.reduce((sum: number, exp: any) => sum + (+exp.amount || 0), 0) || 0;
  }

  get totalLiabilities(): number {
    return this.data?.liabilities?.reduce((sum: number, liab: any) => sum + (+liab.amount || 0), 0) || 0;
  }
}
