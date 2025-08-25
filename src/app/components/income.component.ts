import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Income } from '../shared/services/finance-planner.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class IncomeComponent implements OnInit, OnDestroy {
  incomes$: Observable<Income[]>;
  incomeForm: FormGroup;
  editingId: number | null = null;
  monthlyTotal = 0;
  yearlyTotal = 0;
  private incomesSub: Subscription | undefined;

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.incomeForm = this.fb.group({
      name: [''],
      amount: [''],
      type: ['Monthly'],
      stopDate: ['']
    });
    this.incomes$ = this.financeService.incomes$;
  }

  ngOnInit(): void {
    this.incomesSub = this.incomes$.subscribe(list => {
      this.monthlyTotal = list.filter(i => i.type === 'Monthly').reduce((acc, i) => acc + (+i.amount || 0), 0);
      this.yearlyTotal = this.monthlyTotal * 12;
    });
  }

  ngOnDestroy(): void {
    if (this.incomesSub) {
      this.incomesSub.unsubscribe();
    }
  }

  submit() {
    if (this.editingId !== null) {
      this.financeService.updateIncome({ ...this.incomeForm.value, id: this.editingId });
      this.editingId = null;
    } else {
      this.financeService.addIncome(this.incomeForm.value);
    }
    this.incomeForm.reset({ type: 'Monthly' });
  }

  edit(income: Income) {
    this.incomeForm.patchValue(income);
    this.editingId = income.id;
  }

  cancelEdit() {
    this.incomeForm.reset({ type: 'Monthly' });
    this.editingId = null;
  }

  delete(id: number) {
    this.financeService.deleteIncome(id);
  }
}
