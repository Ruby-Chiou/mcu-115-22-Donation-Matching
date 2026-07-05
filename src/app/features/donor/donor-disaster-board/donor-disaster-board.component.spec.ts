import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterBoardComponent } from './donor-disaster-board.component';

describe('DonorDisasterBoardComponent', () => {
  let component: DonorDisasterBoardComponent;
  let fixture: ComponentFixture<DonorDisasterBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterBoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterBoardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
