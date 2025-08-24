// src/xirr.d.ts
declare module 'xirr' {
  type CashFlow = {
    amount: number;
    when: Date;
  };

  function xirr(cashFlows: CashFlow[]): number;

  export = xirr;
}
