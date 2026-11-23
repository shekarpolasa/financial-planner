import { Component } from '@angular/core';
import { XirrCalculatorService } from './xirr.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-xirr-form',
  templateUrl: './xirr.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe, DecimalPipe],
})
export class XirrFormComponent {
  transactionForm: FormGroup;
  transactions: { amount: number, when: Date }[] = [];
  xirrResult: number | null = null;
  errorMessage: string | null = null;
  editingIndex: number | null = null;

  constructor(private fb: FormBuilder, private xirrService: XirrCalculatorService) {
    this.transactionForm = this.fb.group({
      when: ['', Validators.required],
      amount: [null, Validators.required],
    });
  }

  submit() {
    this.errorMessage = null;
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      this.errorMessage = 'Enter a transaction date and amount.';
      return;
    }

    const { when, amount } = this.transactionForm.getRawValue();
    const transactionDate = new Date(`${when}T00:00:00`);
    const transaction = { amount: Number(amount), when: transactionDate };

    if (!Number.isFinite(transaction.amount) || transaction.amount === 0 || !Number.isFinite(transactionDate.getTime())) {
      this.errorMessage = 'Enter a valid date and a non-zero amount.';
      return;
    }

    if (this.editingIndex === null) {
      this.transactions.push(transaction);
    } else {
      this.transactions[this.editingIndex] = transaction;
      this.editingIndex = null;
    }
    this.resetCalculation();
    this.transactionForm.reset({ when: '', amount: null });
  }

  editTransaction(index: number) {
    const transaction = this.transactions[index];
    this.editingIndex = index;
    this.transactionForm.setValue({
      when: this.formatDateForInput(transaction.when),
      amount: transaction.amount
    });
    this.errorMessage = null;
  }

  deleteTransaction(index: number) {
    this.transactions.splice(index, 1);
    if (this.editingIndex === index) {
      this.cancelEdit();
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }
    this.resetCalculation();
  }

  cancelEdit() {
    this.editingIndex = null;
    this.transactionForm.reset({ when: '', amount: null });
    this.errorMessage = null;
  }

  calculateXIRR() {
    this.errorMessage = null;
    this.xirrResult = null;
    try {
      this.xirrResult = this.xirrService.calculateXIRR(this.transactions);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Unable to calculate XIRR. Check the transaction dates and amounts.';
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resetCalculation() {
    this.xirrResult = null;
    this.errorMessage = null;
  }
}
