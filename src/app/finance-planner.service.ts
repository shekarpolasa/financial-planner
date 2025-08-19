import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Income {
  id: number;
  name: string;
  amount: number;
  type: string;
  retirementAge?: number;
  stopDate?: string;
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

@Injectable({ providedIn: 'root' })
export class FinancePlannerService {
  private _incomes = new BehaviorSubject<Income[]>(this.load('incomes'));
  private _expenses = new BehaviorSubject<Expense[]>(this.load('expenses'));
  private _investments = new BehaviorSubject<Investment[]>(this.load('investments'));
  private _liabilities = new BehaviorSubject<Liability[]>(this.load('liabilities'));

  incomes$ = this._incomes.asObservable();
  expenses$ = this._expenses.asObservable();
  investments$ = this._investments.asObservable();
  liabilities$ = this._liabilities.asObservable();

  private load(key: string) {
    const data = localStorage.getItem('financePlanner_' + key);
    return data ? JSON.parse(data) : [];
  }
  private save(key: string, value: any) {
    localStorage.setItem('financePlanner_' + key, JSON.stringify(value));
  }

  addIncome(income: Omit<Income, 'id'>) {
    const newIncome = { ...income, id: Date.now() };
    const updated = [...this._incomes.value, newIncome];
    this._incomes.next(updated);
    this.save('incomes', updated);
  }
  updateIncome(income: Income) {
    const updated = this._incomes.value.map(i => i.id === income.id ? income : i);
    this._incomes.next(updated);
    this.save('incomes', updated);
  }
  deleteIncome(id: number) {
    const updated = this._incomes.value.filter(i => i.id !== id);
    this._incomes.next(updated);
    this.save('incomes', updated);
  }

  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense = { ...expense, id: Date.now() };
    const updated = [...this._expenses.value, newExpense];
    this._expenses.next(updated);
    this.save('expenses', updated);
  }
  updateExpense(expense: Expense) {
    const updated = this._expenses.value.map(e => e.id === expense.id ? expense : e);
    this._expenses.next(updated);
    this.save('expenses', updated);
  }
  deleteExpense(id: number) {
    const updated = this._expenses.value.filter(e => e.id !== id);
    this._expenses.next(updated);
    this.save('expenses', updated);
  }

  addInvestment(investment: Omit<Investment, 'id'>) {
    const newInvestment = { ...investment, id: Date.now() };
    const updated = [...this._investments.value, newInvestment];
    this._investments.next(updated);
    this.save('investments', updated);
  }
  updateInvestment(investment: Investment) {
    const updated = this._investments.value.map(inv => inv.id === investment.id ? investment : inv);
    this._investments.next(updated);
    this.save('investments', updated);
  }
  deleteInvestment(id: number) {
    const updated = this._investments.value.filter(inv => inv.id !== id);
    this._investments.next(updated);
    this.save('investments', updated);
  }

  addLiability(liability: Omit<Liability, 'id'>) {
    const newLiability = { ...liability, id: Date.now() };
    const updated = [...this._liabilities.value, newLiability];
    this._liabilities.next(updated);
    this.save('liabilities', updated);
  }
  updateLiability(liability: Liability) {
    const updated = this._liabilities.value.map(l => l.id === liability.id ? liability : l);
    this._liabilities.next(updated);
    this.save('liabilities', updated);
  }
  deleteLiability(id: number) {
    const updated = this._liabilities.value.filter(l => l.id !== id);
    this._liabilities.next(updated);
    this.save('liabilities', updated);
  }
}
