import { Injectable } from '@angular/core';
import xirr from 'xirr';

@Injectable({
  providedIn: 'root'
})
export class XirrCalculatorService {

  calculateXIRR(cashFlows: { amount: number, when: Date }[]): number {
    if (cashFlows.length < 2) {
      throw new Error('Add at least two transactions to calculate XIRR.');
    }

    if (cashFlows.some(flow => !Number.isFinite(flow.amount) || flow.amount === 0)) {
      throw new Error('Every transaction must have a valid, non-zero amount.');
    }

    if (cashFlows.some(flow => !(flow.when instanceof Date) || !Number.isFinite(flow.when.getTime()))) {
      throw new Error('Every transaction must have a valid date.');
    }

    if (!cashFlows.some(flow => flow.amount > 0) || !cashFlows.some(flow => flow.amount < 0)) {
      throw new Error('Include at least one investment (negative amount) and one return (positive amount).');
    }

    try {
      const rate = xirr(cashFlows);
      if (!Number.isFinite(rate)) {
        throw new Error('No valid XIRR could be found for these transactions.');
      }
      return rate * 100;
    } catch (error) {
      console.error('Error calculating XIRR', error);
      if (error instanceof Error) {
        throw new Error(`Unable to calculate XIRR: ${error.message}`);
      }
      throw new Error('Unable to calculate XIRR. Check that the transactions are valid.');
    }
  }
}
