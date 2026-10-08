import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeQuickLinksComponent } from './quick-links.component';

describe('HomeQuickLinksComponent', () => {
  let component: HomeQuickLinksComponent;
  let fixture: ComponentFixture<HomeQuickLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeQuickLinksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeQuickLinksComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
