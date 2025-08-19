import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService, Liability } from '../finance-planner.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-liabilities',
  templateUrl: './liabilities.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class LiabilitiesComponent implements OnInit, OnDestroy {
  liabilities$: Observable<Liability[]>;
  liabilityForm: FormGroup;
  editingId: number | null = null;
  principalTotal = 0;
  totalEMI = 0;
  private liabilitiesSub: Subscription | undefined;

  constructor(private fb: FormBuilder, private financeService: FinancePlannerService) {
    this.liabilityForm = this.fb.group({
      name: [''],
      principal: [''],
      interestRate: [''],
      years: ['']
    });
    this.liabilities$ = this.financeService.liabilities$;
  }

  getEMI(liability: Liability): number {
    const principal = +liability.principal;
    const rate = +liability.interestRate / 12 / 100;
    const months = +liability.years * 12;
    if (principal && rate && months) {
      return principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
    }
    return 0;
  }

getTotalInterest(liability: Liability): number {
  const emi = this.getEMI(liability);
  const totalPayment = emi * (+liability.years) * 12;
  return totalPayment - (+liability.principal);
}

  ngOnInit(): void {
    this.liabilitiesSub = this.liabilities$.subscribe(list => {
      this.principalTotal = list.reduce((acc, l) => acc + (+l.principal || 0), 0);
      this.totalEMI = list.reduce((sum, l) => sum + this.getEMI(l), 0);
    });
  }

  ngOnDestroy(): void {
    if (this.liabilitiesSub) {
      this.liabilitiesSub.unsubscribe();
    }
  }

  submit() {
    if (this.editingId !== null) {
      this.financeService.updateLiability({ ...this.liabilityForm.value, id: this.editingId });
      this.editingId = null;
    } else {
      this.financeService.addLiability(this.liabilityForm.value);
    }
    this.liabilityForm.reset();
  }

  edit(liability: Liability) {
    this.liabilityForm.patchValue(liability);
    this.editingId = liability.id;
  }

  cancelEdit() {
    this.liabilityForm.reset();
    this.editingId = null;
  }

  delete(id: number) {
    this.financeService.deleteLiability(id);
  }
}
