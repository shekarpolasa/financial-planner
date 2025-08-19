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

export interface SWPPlan {
  sustainabilityYears: number | null;
  totalInvestmentValue: number;
  totalMonthlyOutflow: number;
  formValues?: any;
  momTable?: any[];
}

@Injectable({ providedIn: 'root' })
export class FinancePlannerService {
  // Storage keys
  private readonly StoragePrefix = 'fp_';
  private readonly SwpKey = 'swpPlan';
  private readonly IncomesKey = 'incomes';
  private readonly ExpensesKey = 'expenses';
  private readonly InvestmentsKey = 'investments';
  private readonly LiabilitiesKey = 'liabilities';

  // BehaviorSubjects for financial data
  private _incomes = new BehaviorSubject<Income[]>(this.load(this.IncomesKey));
  private _expenses = new BehaviorSubject<Expense[]>(this.load(this.ExpensesKey));
  private _investments = new BehaviorSubject<Investment[]>(this.load(this.InvestmentsKey));
  private _liabilities = new BehaviorSubject<Liability[]>(this.load(this.LiabilitiesKey));
  private _swpPlan = new BehaviorSubject<SWPPlan | null>(this.load(this.SwpKey, null));

  // Public observables
  incomes$ = this._incomes.asObservable();
  expenses$ = this._expenses.asObservable();
  investments$ = this._investments.asObservable();
  liabilities$ = this._liabilities.asObservable();
  swpPlan$ = this._swpPlan.asObservable();

  // Generic load/save for financial data
  private load(key: string, defaultValue: any = []) {
    const data = sessionStorage.getItem(this.StoragePrefix + key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private save(key: string, value: any) {
    sessionStorage.setItem(this.StoragePrefix + key, JSON.stringify(value));
  }

  private remove(key: string) {
    sessionStorage.removeItem(this.StoragePrefix + key);
  }

  // ---- Income Methods ----
  addIncome(income: Omit<Income, 'id'>) {
    const newIncome = { ...income, id: Date.now() };
    const updated = [...this._incomes.value, newIncome];
    this._incomes.next(updated);
    this.save(this.IncomesKey, updated);
    this.clearSWPPlan();
  }

  updateIncome(income: Income) {
    const updated = this._incomes.value.map(i => i.id === income.id ? income : i);
    this._incomes.next(updated);
    this.save(this.IncomesKey, updated);
    this.clearSWPPlan();
  }

  deleteIncome(id: number) {
    const updated = this._incomes.value.filter(i => i.id !== id);
    this._incomes.next(updated);
    this.save(this.IncomesKey, updated);
    this.clearSWPPlan();
  }

  // ---- Expense Methods ----
  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense = { ...expense, id: Date.now() };
    const updated = [...this._expenses.value, newExpense];
    this._expenses.next(updated);
    this.save(this.ExpensesKey, updated);
    this.clearSWPPlan();
  }

  updateExpense(expense: Expense) {
    const updated = this._expenses.value.map(e => e.id === expense.id ? expense : e);
    this._expenses.next(updated);
    this.save(this.ExpensesKey, updated);
    this.clearSWPPlan();
  }

  deleteExpense(id: number) {
    const updated = this._expenses.value.filter(e => e.id !== id);
    this._expenses.next(updated);
    this.save(this.ExpensesKey, updated);
    this.clearSWPPlan();
  }

  // ---- Investment Methods ----
  addInvestment(investment: Omit<Investment, 'id'>) {
    const newInvestment = { ...investment, id: Date.now() };
    const updated = [...this._investments.value, newInvestment];
    this._investments.next(updated);
    this.save(this.InvestmentsKey, updated);
    this.clearSWPPlan();
  }

  updateInvestment(investment: Investment) {
    const updated = this._investments.value.map(inv => inv.id === investment.id ? investment : inv);
    this._investments.next(updated);
    this.save(this.InvestmentsKey, updated);
    this.clearSWPPlan();
  }

  deleteInvestment(id: number) {
    const updated = this._investments.value.filter(inv => inv.id !== id);
    this._investments.next(updated);
    this.save(this.InvestmentsKey, updated);
    this.clearSWPPlan();
  }

  // ---- Liability Methods ----
  addLiability(liability: Omit<Liability, 'id'>) {
    const newLiability = { ...liability, id: Date.now() };
    const updated = [...this._liabilities.value, newLiability];
    this._liabilities.next(updated);
    this.save(this.LiabilitiesKey, updated);
    this.clearSWPPlan();
  }

  updateLiability(liability: Liability) {
    const updated = this._liabilities.value.map(l => l.id === liability.id ? liability : l);
    this._liabilities.next(updated);
    this.save(this.LiabilitiesKey, updated);
    this.clearSWPPlan();
  }

  deleteLiability(id: number) {
    const updated = this._liabilities.value.filter(l => l.id !== id);
    this._liabilities.next(updated);
    this.save(this.LiabilitiesKey, updated);
    this.clearSWPPlan();
  }

  // ---- SWP Plan Methods ----
  updateSWPPlan(partialUpdate: Partial<SWPPlan>) {
    const current = this._swpPlan.value || {
      sustainabilityYears: null,
      totalInvestmentValue: 0,
      totalMonthlyOutflow: 0,
      formValues: {},
      momTable: []
    };
    const updated = { ...current, ...partialUpdate };
    this._swpPlan.next(updated);
    this.save(this.SwpKey, updated);
  }

  clearSWPPlan() {
    this.remove(this.SwpKey);
    this._swpPlan.next(null);
  }
}
