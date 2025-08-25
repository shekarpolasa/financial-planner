import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Expense, Liability, Investment } from '../../shared/services/finance-planner.service';
import { SwpResultComponent } from "./swp-result/swp-result.component";
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-swp-plan',
  templateUrl: './swp-plan.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SwpResultComponent]
})
export class SwpPlanComponent {
  swpForm: FormGroup;
  sustainabilityYears: number | null = null;
  totalInvestmentValue: number = 0;
  totalMonthlyOutflow: number = 0;

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.swpForm = this.fb.group({
      startDate: [this.formatDate(new Date()), Validators.required],
      inflationRate: [6, [Validators.required, Validators.min(0), Validators.max(20)]],
      annualReturnRate: [8, [Validators.required, Validators.min(0), Validators.max(100)]],
      corpusAmount: []
    });

    this.financeService.swpPlan$.subscribe(plan => {
      if (plan) {
        this.sustainabilityYears = plan.sustainabilityYears;
        this.totalInvestmentValue = plan.totalInvestmentValue;
        this.totalMonthlyOutflow = plan.totalMonthlyOutflow;

        if (plan.formValues) {
          this.swpForm.patchValue(plan.formValues);
        }
      }
    });

    this.swpForm.get('startDate')?.valueChanges
      .pipe(
        debounceTime(500), // wait for 500ms pause in typing
        distinctUntilChanged() // only proceed if value actually changed
      )
      .subscribe((dateStr: string) => {
        if (dateStr) {
          const date = new Date(dateStr);
          const corpus = this.calculateCorpusValue(date);
          this.swpForm.get('corpusAmount')?.setValue(+corpus.toFixed(0));
        }
      });
  }

  calculateSWP(): void {
    const formValues = this.swpForm.value;
    const swpStartDate = new Date(formValues.startDate);
    const annualReturnRate = +formValues.annualReturnRate;
    const inflationRate = +formValues.inflationRate;
    const userCorpus = +formValues.corpusAmount;

    if (!userCorpus || userCorpus <= 0) {
      alert('Please enter a valid Corpus Amount.');
      return;
    }

    const currentDate = new Date();
    const expenses = (this.financeService as any)._expenses.value as Expense[];
    const liabilities = (this.financeService as any)._liabilities.value as Liability[];

    const yearsToSwpStart = swpStartDate.getFullYear() - currentDate.getFullYear();
    let inflationAdjustedExpenses = this.getInflationAdjustedExpenses(expenses, inflationRate, yearsToSwpStart);
    const emiSchedules = this.getEmiSchedules(liabilities, yearsToSwpStart);

    // // Step 1: Accumulate corpus till SWP start
    // const { balance: startBalance, swpStartSimDate } = this.accumulateCorpusUntilStart(userCorpus, annualReturnRate, currentDate, swpStartDate);
    // const totalInvestmentValue = startBalance;

    // Step 2: Run SWP simulation
    const momTable = this.simulateSwpPhase(swpStartDate, userCorpus, annualReturnRate, inflationRate, inflationAdjustedExpenses, emiSchedules);

    // Final Output Calculations
    this.sustainabilityYears = +(momTable.length / 12).toFixed(1);
    this.totalInvestmentValue = momTable.length ? momTable[0].corpus : 0;
    this.totalMonthlyOutflow = momTable.length ? momTable[0].withdrawal : 0;

    const swp = {
      sustainabilityYears: this.sustainabilityYears,
      totalInvestmentValue: this.totalInvestmentValue,
      totalMonthlyOutflow: this.totalMonthlyOutflow,
      formValues,
      momTable
    };

    this.financeService.updateSWPPlan(swp);
  }

  private getInflationAdjustedExpenses(expenses: Expense[], inflationRate: number, yearsToSwpStart: number): number {
    const baseMonthly = expenses.reduce((sum, exp) => {
      return sum + (exp.type === 'Monthly' ? +exp.amount : +exp.amount / 12);
    }, 0);
    return baseMonthly * Math.pow(1 + inflationRate / 100, Math.max(0, yearsToSwpStart));
  }

  private getEmiSchedules(liabilities: Liability[], yearsToSwpStart: number): { emi: number, remainingMonths: number }[] {
    return liabilities.map(l => {
      const principal = +l.principal;
      const rate = +l.interestRate / 12 / 100;
      const months = +l.years * 12;
      const emi = principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
      return {
        emi,
        remainingMonths: Math.max(0, months - yearsToSwpStart * 12)
      };
    });
  }

  private simulateSwpPhase(
    startDate: Date,
    initialBalance: number,
    annualReturnRate: number,
    inflationRate: number,
    initialMonthlyExpenses: number,
    emiSchedules: { emi: number, remainingMonths: number }[]
  ): any[] {
    const momTable = [];
    const maxSwpMonths = 50 * 12; // Limit to 50 years of SWP
    let swpMonths = 0;
    let simDate = new Date(startDate);
    let balance = initialBalance;
    let monthlyExpenses = initialMonthlyExpenses;

    // Calculate monthly return rate from the annual return rate
    const monthlyReturnRate = Math.pow(1 + annualReturnRate / 100, 1 / 12) - 1;

    while (balance > 0 && swpMonths < maxSwpMonths) {
      // Calculate the total EMI for the current month
      const activeEMI = emiSchedules.reduce((sum, l) => l.remainingMonths > 0 ? sum + l.emi : sum, 0);

      // Monthly withdrawal is expenses + total EMI
      const withdrawal = monthlyExpenses + activeEMI;

      // Apply growth for this month based on monthly compounding
      const growth = balance * monthlyReturnRate;

      // Store the data for the month
      momTable.push({
        period: new Date(simDate),
        corpus: balance,
        growth,
        totalExpenses: monthlyExpenses,
        totalEMI: activeEMI,
        withdrawal,
        net: growth - withdrawal
      });

      // Update the balance after withdrawal and growth
      balance = balance + growth - withdrawal;

      // Reduce the remaining months for each liability's EMI
      emiSchedules.forEach(l => l.remainingMonths--);

      swpMonths++;

      // Apply inflation to expenses every year (monthly inflation)
      if (simDate.getMonth() === 11) {
        monthlyExpenses *= 1 + inflationRate / 100;
      }

      // Move to the next month
      simDate.setMonth(simDate.getMonth() + 1);
    }

    return momTable;
  }

  private calculateCorpusValue(untilDate: Date): number {
    const investments = (this.financeService as any)._investments.value as Investment[];
    let total = 0;
    const now = new Date();

    for (let inv of investments) {
      const months = this.monthDiff(now, untilDate);
      if (months <= 0) continue;

      if (inv.type === 'SIP') {
        const amount = +(inv.monthlyAmount || 0);
        const rate = +(inv.expectedReturn || 0) / 12 / 100;
        // const n = Math.min(months, +(inv.years || 0) * 12);
        const n = months; // Assume SIP continues till the target date
        if (amount && rate && n)
          total += amount * (((Math.pow(1 + rate, n) - 1) / rate) * (1 + rate));
      } else {
        const amount = +(inv.amount || 0);
        const rate = +(inv.expectedReturn || 0);
        // const years = Math.min(months / 12, +(inv.years || 0));
        const years = months / 12; // Assume Lumpsum continues till the target date
        if (amount && rate && years >= 0)
          total += amount * Math.pow(1 + rate / 100, years);
      }
    }

    // total += this.financeService['load']('cash') || 0;
    return total;
  }

  private monthDiff(start: Date, end: Date): number {
    return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  }

  formatMonthYear(date: Date): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
