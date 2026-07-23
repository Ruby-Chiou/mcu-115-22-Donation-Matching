import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailyLobbyComponent } from './donor-daily-lobby.component';

describe('DonorDailyLobbyComponent', () => {
  let component: DonorDailyLobbyComponent;
  let fixture: ComponentFixture<DonorDailyLobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailyLobbyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailyLobbyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
