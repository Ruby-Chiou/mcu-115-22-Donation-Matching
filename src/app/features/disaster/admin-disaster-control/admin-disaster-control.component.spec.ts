import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDisasterControlComponent } from './admin-disaster-control.component';

describe('AdminDisasterControlComponent', () => {
  let component: AdminDisasterControlComponent;
  let fixture: ComponentFixture<AdminDisasterControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDisasterControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDisasterControlComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
