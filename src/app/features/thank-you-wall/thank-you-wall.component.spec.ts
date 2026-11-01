import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardAnnouncementService } from '../../core/services/admin/board-announcement.service';
import { PublicDonationThankService } from '../../core/services/member-center/public-donation-thank.service';
import { ThankYouWallComponent } from './thank-you-wall.component';

describe('ThankYouWallComponent', () => {
  let component: ThankYouWallComponent;
  let fixture: ComponentFixture<ThankYouWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThankYouWallComponent],
      providers: [
        {
          provide: PublicDonationThankService,
          useValue: {
            wall: () => [],
            loadWall: async () => [],
          },
        },
        {
          provide: BoardAnnouncementService,
          useValue: {
            published: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThankYouWallComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
