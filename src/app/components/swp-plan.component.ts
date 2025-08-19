import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Expense, Liability, Investment } from '../finance-planner.service';

@Component({
  selector: 'app-swp-plan',
  templateUrl: './swp-plan.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class SwpPlanComponent {
  public viewMode: 'year' | 'month' = 'year';
  public yoyTable: Array<{ period: string, corpus: number, growth: number, totalExpenses: number, totalEMI: number, withdrawal: number, net: number }> = [];
  public momTable: Array<{ period: string, corpus: number, growth: number, totalExpenses: number, totalEMI: number, withdrawal: number, net: number }> = [];

  public toggleView(mode: 'year' | 'month') {
    this.viewMode = mode;
  }
  swpForm: FormGroup;
  sustainabilityYears: number | null = null;
  totalInvestmentValue: number = 0;
  totalMonthlyOutflow: number = 0;
  resultText: string = '';
  private swpStorageKey: string = 'financePlanner_swpPlan';

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.swpForm = this.fb.group({
      startDate: [''],
      inflationRate: [6],
      annualReturnRate: [8],
      corpusAmount: ['']
    });
    // Restore SWP plan from localStorage if available
    const saved = localStorage.getItem(this.swpStorageKey);
    if (saved) {
      const swp = JSON.parse(saved);
      this.sustainabilityYears = swp.sustainabilityYears;
      this.totalInvestmentValue = swp.totalInvestmentValue;
      this.totalMonthlyOutflow = swp.totalMonthlyOutflow;
      this.resultText = swp.resultText;
      if (swp.formValues) {
        this.swpForm.patchValue(swp.formValues);
      }
    }
  }

  calculateSWP(): void {
    this.yoyTable = [];
    this.momTable = [];
    const startDate = new Date(this.swpForm.value.startDate);
    const inflationRate = +this.swpForm.value.inflationRate;
    const annualReturnRate = +this.swpForm.value.annualReturnRate;

    // Get all investments
    const investments = (this.financeService as any)._investments.value as Investment[];
    let totalInvestmentValue = 0;

    // Calculate future value of SIP and Lumpsum investments
    investments.forEach(inv => {
      if (inv.type === 'SIP') {
        // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
        const monthlyAmount = +(inv.monthlyAmount || 0);
        const annualRate = +(inv.expectedReturn || 0);
        const years = +(inv.years || 0);
        const monthlyRate = annualRate / 12 / 100;
        const months = years * 12;
        if (monthlyAmount && monthlyRate && months) {
          totalInvestmentValue += monthlyAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        }
      } else {
        // FV = PV * (1 + r)^n
        const amount = +(inv.amount || 0);
        const annualRate = +(inv.expectedReturn || 0);
        const years = +(inv.years || 0);
        if (amount && annualRate && years) {
          totalInvestmentValue += amount * Math.pow(1 + annualRate / 100, years);
        }
      }
    });

    // Add cash holdings
    totalInvestmentValue += this.financeService['load']('cash') || 0;

    // Use user input corpus if provided
    const userCorpus = +(this.swpForm.value.corpusAmount);
    if (userCorpus > 0) {
      totalInvestmentValue = userCorpus;
    }

    // Calculate monthly expenses
    const expenses = (this.financeService as any)._expenses.value as Expense[];
    let monthlyExpenses = 0;
    expenses.forEach(exp => {
      if (exp.type === 'Monthly') monthlyExpenses += +exp.amount;
      else if (exp.type === 'Yearly') monthlyExpenses += +exp.amount / 12;
    });

    // Inflate monthly expenses from current year to SWP start year
    const swpStartYear = startDate.getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsToSwpStart = swpStartYear - currentYear;
    let inflationAdjustedMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToSwpStart);

    // Prepare EMI schedule
    const liabilities = (this.financeService as any)._liabilities.value as Liability[];
    const emiSchedules: Array<{ emi: number, remainingMonths: number }> = liabilities.map(liability => {
      const principal = +liability.principal;
      const rate = +liability.interestRate / 12 / 100;
      const months = +liability.years * 12;
      let emi = 0;
      if (principal && rate && months) {
        emi = principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
      }
      let remainingMonths = Math.max(0, months - yearsToSwpStart * 12);
      return { emi, remainingMonths };
    });

    // Total monthly outflow at SWP start
    let totalMonthlyOutflow = inflationAdjustedMonthlyExpenses + emiSchedules.reduce((sum, l) => sum + l.emi, 0);

    // Initialize simulation
    let balance = totalInvestmentValue;
    let currentMonthlyExpenses = inflationAdjustedMonthlyExpenses;

    // Date handling
    const currentDate = new Date();
    const swpStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let simDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    let totalMonths = 0;
    let swpMonths = 0;

    // Year tracking - simplified
    let currentYearData = {
      startBalance: 0,
      growth: 0,
      withdrawal: 0,
      expenses: 0,
      emi: 0,
      startMonth: 0
    };
    let swpYears = 0;

    while (balance > 0 && totalMonths < 600) {

      if (simDate < swpStartDate) {
        // Growth phase - before SWP starts
        balance = balance * (1 + annualReturnRate / 12 / 100);

      } else {
        // Withdrawal phase - SWP has started

        // Initialize year tracking on first SWP month
        if (swpMonths === 0) {
          currentYearData.startBalance = balance;
          currentYearData.startMonth = swpMonths;
        }

        // Calculate current month's transactions
        const activeEMI = emiSchedules.reduce((sum, l) => l.remainingMonths > 0 ? sum + l.emi : sum, 0);
        const withdrawal = currentMonthlyExpenses + activeEMI;
        const prevBalance = balance;
        const growth = prevBalance * (annualReturnRate / 12 / 100);

        balance = balance * (1 + annualReturnRate / 12 / 100) - withdrawal;
        const net = growth - withdrawal;

        // Add to month table
        this.momTable.push({
          period: this.formatMonthYear(simDate),
          corpus: prevBalance,
          growth,
          totalExpenses: currentMonthlyExpenses,
          totalEMI: activeEMI,
          withdrawal,
          net
        });

        // Accumulate year data
        currentYearData.growth += growth;
        currentYearData.withdrawal += withdrawal;
        currentYearData.expenses += currentMonthlyExpenses;
        currentYearData.emi += activeEMI;

        // Check if calendar year is complete (December)
        const currentMonth = simDate.getMonth(); // 0-11
        const currentYear = simDate.getFullYear();
        const isCalendarYearEnd = currentMonth === 11; // December

        if (isCalendarYearEnd || balance <= 0) {
          // Add completed calendar year to table
          this.yoyTable.push({
            period: `${currentYear}`,
            corpus: currentYearData.startBalance,
            growth: currentYearData.growth,
            totalExpenses: currentYearData.expenses,
            totalEMI: currentYearData.emi,
            withdrawal: currentYearData.withdrawal,
            net: currentYearData.growth - currentYearData.withdrawal
          });

          // Reset for next calendar year (only if not end of simulation)
          if (balance > 0) {
            currentYearData = {
              startBalance: balance,
              growth: 0,
              withdrawal: 0,
              expenses: 0,
              emi: 0,
              startMonth: swpMonths + 1
            };

            // Apply annual inflation at year end
            currentMonthlyExpenses = currentMonthlyExpenses * (1 + inflationRate / 100);
          }
        }

        // Update EMI remaining months
        emiSchedules.forEach(l => {
          if (l.remainingMonths > 0) l.remainingMonths--;
        });

        swpMonths++;
      }

      // Move to next month
      simDate.setMonth(simDate.getMonth() + 1);
      totalMonths++;
    }

    // Final calculations
    this.sustainabilityYears = +(swpMonths / 12).toFixed(1);
    this.totalInvestmentValue = totalInvestmentValue;
    this.totalMonthlyOutflow = totalMonthlyOutflow;
    this.resultText = `Corpus will last for ${this.sustainabilityYears} years from SWP start.`;

    // Save to localStorage
    localStorage.setItem(this.swpStorageKey, JSON.stringify({
      sustainabilityYears: this.sustainabilityYears,
      totalInvestmentValue: this.totalInvestmentValue,
      totalMonthlyOutflow: this.totalMonthlyOutflow,
      resultText: this.resultText,
      formValues: this.swpForm.value
    }));
  }

  formatMonthYear(date: Date): string {
    return `${this.getMonthName(date.getMonth())} ${date.getFullYear()}`;
  }
  getMonthName(month: number): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[month];
  }
}
