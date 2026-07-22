import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterLobbyComponent } from './donor-disaster-lobby.component';

describe('DonorDisasterBoardComponent', () => {
  let component: DonorDisasterLobbyComponent;
  let fixture: ComponentFixture<DonorDisasterLobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterLobbyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterLobbyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
