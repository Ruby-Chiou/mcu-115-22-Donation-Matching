import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicDonationThankService } from '../../../core/services/member-center/public-donation-thank.service';
import { ThanksMarqueeComponent } from './thanks-marquee.component';

describe('ThanksMarqueeComponent', () => {
  let component: ThanksMarqueeComponent;
  let fixture: ComponentFixture<ThanksMarqueeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThanksMarqueeComponent],
      providers: [
        {
          provide: PublicDonationThankService,
          useValue: {
            broadcasts: () => [],
            loadBroadcasts: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThanksMarqueeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
