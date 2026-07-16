import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DisasterDemandService {
  demands: any[] = [];

  addDemand(demand: any) {
    this.demands.push({
      id: this.demands.length + 1,
      ...demand,
    });
  }

  getDemands() {
    return this.demands;
  }
  getDemandById(id: number) {
    return this.demands.find((demand) => demand.id === id);
  }

  updateDemand(updatedDemand: any) {
    const index = this.demands.findIndex((item) => item.id === updatedDemand.id);

    if (index !== -1) {
      this.demands[index] = updatedDemand;
    }
  }

  deleteDemand(id: number) {
    this.demands = this.demands.filter((item) => item.id !== id);
  }
}
