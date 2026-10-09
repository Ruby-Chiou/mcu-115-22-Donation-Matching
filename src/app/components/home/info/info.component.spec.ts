import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeInfoComponent } from './info.component';

describe('HomeInfoComponent', () => {
  let component: HomeInfoComponent;
  let fixture: ComponentFixture<HomeInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeInfoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
