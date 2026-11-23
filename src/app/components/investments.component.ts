import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Investment } from '../shared/services/finance-planner.service';
import { map, Observable, Subscription } from 'rxjs';

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
  currentValueTotal = 0;
  private investmentsSub: Subscription | undefined;

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.investmentForm = this.fb.group({
      name: [''],
      type: ['Cash'],
      amount: [''],
      monthlyContribution: [''],
      expectedReturn: [''],
      years: ['']
    });
    this.investments$ = this.financeService.investments$.pipe(
      map(investments => investments.filter(investment => investment.type !== 'SIP' && investment.type !== 'Lumpsum'))
    );
  }

  getMaturityValue(investment: Investment): number {
    const currentValue = +(investment.amount || 0);
    const monthlyContribution = +(investment.monthlyContribution || 0);
    const monthlyRate = +(investment.expectedReturn || 0) / 12 / 100;
    const months = +(investment.years || 0) * 12;

    if (months <= 0) {
      return currentValue;
    }

    const currentValueAtMaturity = currentValue * Math.pow(1 + monthlyRate, months);
    const contributionsAtMaturity = monthlyRate === 0
      ? monthlyContribution * months
      : monthlyContribution * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    return currentValueAtMaturity + contributionsAtMaturity;
  }

  ngOnInit(): void {
    this.investmentsSub = this.investments$.subscribe(list => {
      this.monthlyTotal = list.reduce((acc, i) => acc + (+(i.monthlyContribution || 0)), 0);
      this.currentValueTotal = list.reduce((acc, i) => acc + (+(i.amount || 0)), 0);
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
    this.investmentForm.reset({ name: '', type: 'Cash' });
  }

  edit(investment: Investment) {
    this.investmentForm.patchValue({ ...investment, name: investment.name || '' });
    this.editingId = investment.id;
  }

  cancelEdit() {
    this.investmentForm.reset({ name: '', type: 'Cash' });
    this.editingId = null;
  }

  delete(id: number) {
    this.financeService.deleteInvestment(id);
  }
}
