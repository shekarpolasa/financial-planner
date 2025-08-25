import { Expense, Income, Investment, Liability, SWPPlan } from "../../shared/services/finance-planner.service";

export interface Scenario {
  id: string; // could be UUID or timestamp
  name: string;
  createdAt: string;
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  liabilities: Liability[];
  swpPlan: SWPPlan | null;
}
