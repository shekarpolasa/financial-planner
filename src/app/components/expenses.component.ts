import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Expense } from '../shared/services/finance-planner.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses$: Observable<Expense[]>;
  expenseForm: FormGroup;
  editingId: number | null = null;
  monthlyTotal = 0;
  yearlyTotal = 0;
  private expensesSub: Subscription | undefined;

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.expenseForm = this.fb.group({
      name: [''],
      amount: [''],
      type: ['Monthly']
    });
    this.expenses$ = this.financeService.expenses$;
  }

  ngOnInit(): void {
    this.expensesSub = this.expenses$.subscribe((expenses: Expense[]) => {
      this.monthlyTotal = expenses.reduce((total: number, e: Expense) => total + (e.type === 'Monthly' ? +e.amount : +e.amount / 12), 0);
      this.yearlyTotal = expenses.reduce((total: number, e: Expense) => total + (e.type === 'Monthly' ? +e.amount * 12 : +e.amount), 0);
    });
  }

  ngOnDestroy(): void {
    if (this.expensesSub) {
      this.expensesSub.unsubscribe();
    }
  }

  submit() {
    if (this.editingId !== null) {
      this.financeService.updateExpense({ ...this.expenseForm.value, id: this.editingId });
      this.editingId = null;
    } else {
      this.financeService.addExpense(this.expenseForm.value);
    }
    this.expenseForm.reset({ type: 'Monthly' });
  }

  edit(expense: Expense) {
    this.expenseForm.patchValue(expense);
    this.editingId = expense.id;
  }

  cancelEdit() {
    this.expenseForm.reset({ type: 'Monthly' });
    this.editingId = null;
  }

  delete(id: number) {
    this.financeService.deleteExpense(id);
  }
}
