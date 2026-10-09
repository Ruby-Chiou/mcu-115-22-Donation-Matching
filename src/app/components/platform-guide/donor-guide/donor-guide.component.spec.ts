import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorGuideComponent } from './donor-guide.component';

describe('DonorGuideComponent', () => {
  let component: DonorGuideComponent;
  let fixture: ComponentFixture<DonorGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorGuideComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorGuideComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
