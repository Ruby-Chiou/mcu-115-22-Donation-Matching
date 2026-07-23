import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorHistoryComponent } from './donor-history.component';

describe('DonorHistoryComponent', () => {
  let component: DonorHistoryComponent;
  let fixture: ComponentFixture<DonorHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorHistoryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
