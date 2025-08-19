export interface Income {
  id: number;
  name: string;
  amount: number;
  type: string;
  retirementAge?: number;
}
export interface Expense {
  id: number;
  name: string;
  amount: number;
  type: string;
}
export interface Investment {
  id: number;
  type: string;
  monthlyAmount?: number;
  amount?: number;
  expectedReturn?: number;
  years?: number;
}
export interface Liability {
  id: number;
  name: string;
  principal: number;
  interestRate: number;
  years: number;
}

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})

export class App {
  protected readonly title = signal('finance-planner');

  data: {
    incomes: Income[];
    expenses: Expense[];
    investments: Investment[];
    liabilities: Liability[];
  } = {
    incomes: [],
    expenses: [],
    investments: [],
    liabilities: []
  };

  constructor() {
    this.loadData();
  }

  loadData() {
    const saved = localStorage.getItem('financePlannerData');
    if (saved) {
      this.data = JSON.parse(saved);
    }
  }

  saveData() {
    alert();
    localStorage.setItem('financePlannerData', JSON.stringify(this.data));
  }

  handleAddIncome = (income: any) => {
    income.id = Date.now();
    this.data.incomes.push(income);
    this.saveData();
  };
  handleUpdateIncome = (income: any) => {
    this.data.incomes = this.data.incomes.map(i => i.id === income.id ? income : i);
    this.saveData();
  };
  handleDeleteIncome = (id: number) => {
    this.data.incomes = this.data.incomes.filter(i => i.id !== id);
    this.saveData();
  };

  handleAddExpense = (expense: any) => {
    expense.id = Date.now();
    this.data.expenses.push(expense);
    this.saveData();
  };
  handleUpdateExpense = (expense: any) => {
    this.data.expenses = this.data.expenses.map(e => e.id === expense.id ? expense : e);
    this.saveData();
  };
  handleDeleteExpense = (id: number) => {
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    this.saveData();
  };

  handleAddInvestment = (investment: any) => {
    investment.id = Date.now();
    this.data.investments.push(investment);
    debugger;
    this.saveData();
  };
  handleUpdateInvestment = (investment: any) => {
    this.data.investments = this.data.investments.map(inv => inv.id === investment.id ? investment : inv);
    this.saveData();
  };
  handleDeleteInvestment = (id: number) => {
    this.data.investments = this.data.investments.filter(inv => inv.id !== id);
    this.saveData();
  };

  handleAddLiability = (liability: any) => {
    liability.id = Date.now();
    this.data.liabilities.push(liability);
    this.saveData();
  };
  handleUpdateLiability = (liability: any) => {
    this.data.liabilities = this.data.liabilities.map(l => l.id === liability.id ? liability : l);
    this.saveData();
  };
  handleDeleteLiability = (id: number) => {
    this.data.liabilities = this.data.liabilities.filter(l => l.id !== id);
    this.saveData();
  };
}
