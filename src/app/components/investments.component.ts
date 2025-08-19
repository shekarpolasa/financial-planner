import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Investment } from '../finance-planner.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-investments',
  templateUrl: './investments.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class InvestmentsComponent implements OnInit, OnDestroy {
  investments$: Observable<Investment[]>;
  investmentForm: FormGroup;
  editingId: number | null = null;
  monthlyTotal = 0;
  yearlyTotal = 0;
  private investmentsSub: Subscription | undefined;

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.investmentForm = this.fb.group({
      type: ['SIP'],
      monthlyAmount: [''],
      amount: [''],
      expectedReturn: [''],
      years: ['']
    });
    this.investments$ = this.financeService.investments$;
  }

  getMaturityValue(investment: Investment): number {
    if (investment.type === 'SIP') {
      const monthlyAmount = +(investment.monthlyAmount || 0);
      const annualRate = +(investment.expectedReturn || 0);
      const years = +(investment.years || 0);
      const monthlyRate = annualRate / 12 / 100;
      const months = years * 12;
      if (monthlyAmount && monthlyRate && months) {
        return monthlyAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
      }
    } else if (investment.type === 'Lumpsum') {
      const amount = +(investment.amount || 0);
      const annualRate = +(investment.expectedReturn || 0);
      const years = +(investment.years || 0);
      if (amount && annualRate && years) {
        return amount * Math.pow(1 + annualRate / 100, years);
      }
    }
    return 0;
  }

  ngOnInit(): void {
    this.investmentsSub = this.investments$.subscribe(list => {
      this.monthlyTotal = list.filter(i => i.type === 'SIP').reduce((acc, i) => acc + (+(i.monthlyAmount || 0)), 0);
      this.yearlyTotal = list.filter(i => i.type === 'Lumpsum').reduce((acc, i) => acc + (+(i.amount || 0)), 0);
    });
  }

  ngOnDestroy(): void {
    if (this.investmentsSub) {
      this.investmentsSub.unsubscribe();
    }
  }

  submit() {
    if (this.editingId !== null) {
      this.financeService.updateInvestment({ ...this.investmentForm.value, id: this.editingId });
      this.editingId = null;
    } else {
      this.financeService.addInvestment(this.investmentForm.value);
    }
    this.investmentForm.reset({ type: 'SIP' });
  }

  edit(investment: Investment) {
    this.investmentForm.patchValue(investment);
    this.editingId = investment.id;
  }

  cancelEdit() {
    this.investmentForm.reset({ type: 'SIP' });
    this.editingId = null;
  }

  delete(id: number) {
    this.financeService.deleteInvestment(id);
  }
}
