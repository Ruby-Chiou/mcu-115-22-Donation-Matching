import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicGuideComponent } from './public-guide.component';

describe('PublicGuideComponent', () => {
  let component: PublicGuideComponent;
  let fixture: ComponentFixture<PublicGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicGuideComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicGuideComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
