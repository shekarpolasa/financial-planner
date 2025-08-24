import { Component } from '@angular/core';
import { XirrCalculatorService } from './xirr.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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

  constructor(private fb: FormBuilder, private xirrService: XirrCalculatorService) {
    this.transactionForm = this.fb.group({
      when: [''],
      amount: [0],
    });
  }

  submit() {
    const transactionDate = new Date(this.transactionForm.value.when);
    this.transactions.push({ amount: this.transactionForm.value.amount, when: transactionDate });
    this.transactionForm.reset();
  }

  calculateXIRR() {
    if (this.transactions.length > 0) {
      this.xirrResult = this.xirrService.calculateXIRR(this.transactions);
    }
  }
}
