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
  sustainabilityCapped = false;
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
        this.sustainabilityCapped = plan.sustainabilityCapped ?? false;
        this.totalInvestmentValue = plan.totalInvestmentValue;
        this.totalMonthlyOutflow = plan.totalMonthlyOutflow;

        if (plan.formValues) {
          this.swpForm.patchValue(plan.formValues);
        }
      } else {
        this.sustainabilityYears = null;
        this.sustainabilityCapped = false;
      }
    });

    this.swpForm.get('startDate')?.valueChanges
      .pipe(
        debounceTime(500), // wait for 500ms pause in typing
        distinctUntilChanged() // only proceed if value actually changed
      )
      .subscribe((dateStr: string) => {
        if (dateStr) {
          const date = this.parseDateInput(dateStr);
          const corpus = this.calculateCorpusValue(date);
          this.swpForm.get('corpusAmount')?.setValue(+corpus.toFixed(0));
        }
      });
  }

  calculateSWP(): void {
    const formValues = this.swpForm.value;
    const swpStartDate = this.parseDateInput(formValues.startDate);
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

    const monthsToSwpStart = this.monthDiff(currentDate, swpStartDate);
    const yearsToSwpStart = monthsToSwpStart / 12;
    const inflationAdjustedExpenses = this.getInflationAdjustedExpenses(expenses, inflationRate, yearsToSwpStart);
    const emiSchedules = this.getEmiSchedules(liabilities, monthsToSwpStart);

    // // Step 1: Accumulate corpus till SWP start
    // const { balance: startBalance, swpStartSimDate } = this.accumulateCorpusUntilStart(userCorpus, annualReturnRate, currentDate, swpStartDate);
    // const totalInvestmentValue = startBalance;

    // Step 2: Run SWP simulation
    const simulation = this.simulateSwpPhase(
      swpStartDate,
      userCorpus,
      annualReturnRate,
      inflationRate,
      inflationAdjustedExpenses,
      emiSchedules
    );
    const momTable = simulation.momTable;

    // Final Output Calculations
    this.sustainabilityYears = Math.floor((simulation.sustainabilityMonths / 12) * 10) / 10;
    this.sustainabilityCapped = simulation.capped;
    this.totalInvestmentValue = momTable.length ? momTable[0].corpus : 0;
    this.totalMonthlyOutflow = momTable.length ? momTable[0].scheduledWithdrawal : 0;

    const swp = {
      sustainabilityYears: this.sustainabilityYears,
      sustainabilityCapped: this.sustainabilityCapped,
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

  private getEmiSchedules(liabilities: Liability[], monthsToSwpStart: number): { emi: number, remainingMonths: number }[] {
    return liabilities.map(l => {
      const principal = +l.principal;
      const rate = +l.interestRate / 12 / 100;
      const months = +(l.tenureMonths ?? (l.years || 0) * 12);
      const emi = months <= 0
        ? 0
        : rate === 0
          ? principal / months
          : principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
      return {
        emi,
        remainingMonths: Math.max(0, Math.ceil(months - monthsToSwpStart))
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
  ): { momTable: any[]; sustainabilityMonths: number; capped: boolean } {
    const momTable = [];
    const maxSwpMonths = 50 * 12; // Limit to 50 years of SWP
    let swpMonths = 0;
    let sustainabilityMonths = 0;
    let simDate = new Date(startDate);
    let balance = initialBalance;
    let monthlyExpenses = initialMonthlyExpenses;

    // Calculate monthly return rate from the annual return rate
    const monthlyReturnRate = Math.pow(1 + annualReturnRate / 100, 1 / 12) - 1;

    while (balance > 0 && swpMonths < maxSwpMonths) {
      // Calculate the total EMI for the current month
      const activeEMI = emiSchedules.reduce((sum, l) => l.remainingMonths > 0 ? sum + l.emi : sum, 0);

      // Monthly withdrawal is expenses + total EMI
      const scheduledWithdrawal = monthlyExpenses + activeEMI;

      // Apply growth for this month based on monthly compounding
      const growth = balance * monthlyReturnRate;
      const availableBalance = Math.max(0, balance + growth);
      const withdrawal = Math.min(scheduledWithdrawal, availableBalance);
      const shortfall = scheduledWithdrawal - withdrawal;

      // Store the data for the month
      momTable.push({
        period: new Date(simDate),
        corpus: balance,
        growth,
        totalExpenses: monthlyExpenses,
        totalEMI: activeEMI,
        scheduledWithdrawal,
        withdrawal,
        shortfall,
        net: growth - withdrawal
      });

      // Update the balance after withdrawal and growth
      balance = availableBalance - withdrawal;
      sustainabilityMonths += scheduledWithdrawal > 0
        ? withdrawal / scheduledWithdrawal
        : 1;

      // Reduce the remaining months for each liability's EMI
      emiSchedules.forEach(l => l.remainingMonths--);

      swpMonths++;

      if (shortfall > 0) {
        break;
      }

      // Apply annual inflation after each 12 simulated months, relative to the SWP start.
      if (swpMonths % 12 === 0) {
        monthlyExpenses *= 1 + inflationRate / 100;
      }

      // Move to the next month
      simDate.setMonth(simDate.getMonth() + 1);
    }

    return {
      momTable,
      sustainabilityMonths,
      capped: swpMonths === maxSwpMonths && balance > 0
    };
  }

  private calculateCorpusValue(untilDate: Date): number {
    const investments = (this.financeService as any)._investments.value as Investment[];
    let total = 0;
    const now = new Date();

    for (let inv of investments) {
      if (inv.type === 'SIP' || inv.type === 'Lumpsum') continue;
      const months = this.monthDiff(now, untilDate);
      if (months <= 0) continue;

      const currentValue = +(inv.amount || 0);
      const monthlyContribution = +(inv.monthlyContribution || 0);
      const monthlyRate = +(inv.expectedReturn || 0) / 12 / 100;
      total += currentValue * Math.pow(1 + monthlyRate, months);
      total += monthlyRate === 0
        ? monthlyContribution * months
        : monthlyContribution * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    }

    // total += this.financeService['load']('cash') || 0;
    return total;
  }

  private monthDiff(start: Date, end: Date): number {
    const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (normalizedEnd <= normalizedStart) {
      return 0;
    }

    let wholeMonths =
      (normalizedEnd.getFullYear() - normalizedStart.getFullYear()) * 12 +
      normalizedEnd.getMonth() - normalizedStart.getMonth();
    let monthAnchor = this.addMonthsClamped(normalizedStart, wholeMonths);

    if (monthAnchor > normalizedEnd) {
      wholeMonths--;
      monthAnchor = this.addMonthsClamped(normalizedStart, wholeMonths);
    }

    const nextMonthAnchor = this.addMonthsClamped(normalizedStart, wholeMonths + 1);
    const elapsedInMonth = normalizedEnd.getTime() - monthAnchor.getTime();
    const durationOfMonth = nextMonthAnchor.getTime() - monthAnchor.getTime();

    return wholeMonths + elapsedInMonth / durationOfMonth;
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDayOfTargetMonth = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth() + 1,
      0
    ).getDate();
    return new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      Math.min(date.getDate(), lastDayOfTargetMonth)
    );
  }

  private parseDateInput(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  formatMonthYear(date: Date): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
