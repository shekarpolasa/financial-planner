import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Scenario } from '../models/scenario.model';
import { LocalStorageService } from './local-storage.service';

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
  private readonly ScenariosKey = 'scenarios';
  private readonly ActiveScenarioIdKey = 'activeScenarioId';

  private _incomes!: BehaviorSubject<Income[]>;
  private _expenses!: BehaviorSubject<Expense[]>;
  private _investments!: BehaviorSubject<Investment[]>;
  private _liabilities!: BehaviorSubject<Liability[]>;
  private _swpPlan!: BehaviorSubject<SWPPlan | null>;
  private _scenarios!: BehaviorSubject<Scenario[]>;
  private _activeScenarioId!: BehaviorSubject<string | null>;

  incomes$!: Observable<Income[]>;
  expenses$!: Observable<Expense[]>;
  investments$!: Observable<Investment[]>;
  liabilities$!: Observable<Liability[]>;
  swpPlan$!: Observable<SWPPlan | null>;
  scenarios$ = this._scenarios?.asObservable();
  activeScenarioId$ = this._activeScenarioId?.asObservable();

  constructor(private storage: LocalStorageService) {
    const scenarios = this.load(this.ScenariosKey, []);
    const activeId = this.load(this.ActiveScenarioIdKey, null);

    this._scenarios = new BehaviorSubject<Scenario[]>(scenarios);
    this._activeScenarioId = new BehaviorSubject<string | null>(activeId);

    this.scenarios$ = this._scenarios.asObservable();
    this.activeScenarioId$ = this._activeScenarioId.asObservable();

    // Initialize financial data
    let initialScenario = scenarios.find((s: Scenario) => s.id === activeId);

    if (!initialScenario) {
      const baseline: Scenario = {
        id: 'baseline',
        name: 'Baseline',
        createdAt: new Date().toISOString(),
        incomes: [],
        expenses: [],
        investments: [],
        liabilities: [],
        swpPlan: null
      };
      scenarios.push(baseline);
      this._scenarios.next(scenarios);
      this._activeScenarioId.next('baseline');
      initialScenario = baseline;
      this.save(this.ScenariosKey, scenarios);
      this.save(this.ActiveScenarioIdKey, 'baseline');
    }

    this._incomes = new BehaviorSubject<Income[]>(initialScenario.incomes || []);
    this._expenses = new BehaviorSubject<Expense[]>(initialScenario.expenses || []);
    this._investments = new BehaviorSubject<Investment[]>(initialScenario.investments || []);
    this._liabilities = new BehaviorSubject<Liability[]>(initialScenario.liabilities || []);
    this._swpPlan = new BehaviorSubject<SWPPlan | null>(initialScenario.swpPlan || null);

    this.incomes$ = this._incomes.asObservable();
    this.expenses$ = this._expenses.asObservable();
    this.investments$ = this._investments.asObservable();
    this.liabilities$ = this._liabilities.asObservable();
    this.swpPlan$ = this._swpPlan.asObservable();
  }

  // Generic load/save for financial data
  private load(key: string, defaultValue: any = []) {
    return this.storage.read(key, defaultValue);
  }

  private save(key: string, value: any) {
    this.storage.write(key, value);
  }

  // ---- Income Methods ----
  addIncome(income: Omit<Income, 'id'>) {
    const newIncome = { ...income, id: Date.now() };
    const updated = [...this._incomes.value, newIncome];
    this._incomes.next(updated);
    this.persistCurrentScenario();
  }

  updateIncome(income: Income) {
    const updated = this._incomes.value.map(i => i.id === income.id ? income : i);
    this._incomes.next(updated);
    this.persistCurrentScenario();
  }

  deleteIncome(id: number) {
    const updated = this._incomes.value.filter(i => i.id !== id);
    this._incomes.next(updated);
    this.persistCurrentScenario();
  }

  // ---- Expense Methods ----
  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense = { ...expense, id: Date.now() };
    const updated = [...this._expenses.value, newExpense];
    this._expenses.next(updated);
    this.persistCurrentScenario();
  }

  updateExpense(expense: Expense) {
    const updated = this._expenses.value.map(e => e.id === expense.id ? expense : e);
    this._expenses.next(updated);
    this.persistCurrentScenario();
  }

  deleteExpense(id: number) {
    const updated = this._expenses.value.filter(e => e.id !== id);
    this._expenses.next(updated);
    this.persistCurrentScenario();
  }

  // ---- Investment Methods ----
  addInvestment(investment: Omit<Investment, 'id'>) {
    const newInvestment = { ...investment, id: Date.now() };
    const updated = [...this._investments.value, newInvestment];
    this._investments.next(updated);
    this.persistCurrentScenario();
  }

  updateInvestment(investment: Investment) {
    const updated = this._investments.value.map(inv => inv.id === investment.id ? investment : inv);
    this._investments.next(updated);
    this.persistCurrentScenario();
  }

  deleteInvestment(id: number) {
    const updated = this._investments.value.filter(inv => inv.id !== id);
    this._investments.next(updated);
    this.persistCurrentScenario();
  }

  // ---- Liability Methods ----
  addLiability(liability: Omit<Liability, 'id'>) {
    const newLiability = { ...liability, id: Date.now() };
    const updated = [...this._liabilities.value, newLiability];
    this._liabilities.next(updated);
    this.persistCurrentScenario();
  }

  updateLiability(liability: Liability) {
    const updated = this._liabilities.value.map(l => l.id === liability.id ? liability : l);
    this._liabilities.next(updated);
    this.persistCurrentScenario();
  }

  deleteLiability(id: number) {
    const updated = this._liabilities.value.filter(l => l.id !== id);
    this._liabilities.next(updated);
    this.persistCurrentScenario();
  }

  // ---- SWP Methods ----
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
    this.persistCurrentScenario();
  }

  clearSWPPlan() {
    this._swpPlan.next(null);
    this.persistCurrentScenario();
  }

  // ---- Scenario Methods ----
  createScenario(name: string): void {
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      incomes: this._incomes.value || [],
      expenses: this._expenses.value || [],
      investments: this._investments.value || [],
      liabilities: this._liabilities.value || [],
      swpPlan: null
    };

    const updated = [...this._scenarios.value, newScenario];
    this._scenarios.next(updated);
    this.save(this.ScenariosKey, updated);
    this.setActiveScenario(newScenario.id);
  }

  setActiveScenario(scenarioId: string) {
    this._activeScenarioId.next(scenarioId);
    this.save(this.ActiveScenarioIdKey, scenarioId);

    const scenario = this._scenarios.value.find(s => s.id === scenarioId);
    if (scenario) {
      this._incomes.next(scenario.incomes);
      this._expenses.next(scenario.expenses);
      this._investments.next(scenario.investments);
      this._liabilities.next(scenario.liabilities);
      this._swpPlan.next(scenario.swpPlan);
    }
  }

  deleteScenario(scenarioId: string): void {
    const scenarios = this._scenarios.value;

    if (scenarioId === 'baseline') {
      alert('Cannot delete the Baseline scenario.');
      return;
    }

    const updated = scenarios.filter(s => s.id !== scenarioId);
    this._scenarios.next(updated);
    this.save(this.ScenariosKey, updated);

    if (this._activeScenarioId.value === scenarioId) {
      this.setActiveScenario('baseline');
    }
  }

  renameScenario(scenarioId: string, newName: string): void {
    const scenarios = this._scenarios.value.map(s => {
      return s.id === scenarioId ? { ...s, name: newName } : s;
    });
    this._scenarios.next(scenarios);
    this.save(this.ScenariosKey, scenarios);
  }

  private persistCurrentScenario(): void {
    const scenarios = this._scenarios.value;
    const id = this._activeScenarioId.value;
    if (!id) return;

    const idx = scenarios.findIndex(s => s.id === id);
    if (idx === -1) return;

    scenarios[idx] = {
      ...scenarios[idx],
      incomes: this._incomes.value,
      expenses: this._expenses.value,
      investments: this._investments.value,
      liabilities: this._liabilities.value,
      swpPlan: this._swpPlan.value
    };

    this._scenarios.next(scenarios);
    this.save(this.ScenariosKey, scenarios);
  }
}
