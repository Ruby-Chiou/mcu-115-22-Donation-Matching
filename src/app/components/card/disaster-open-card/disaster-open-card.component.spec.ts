import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenCardComponent } from './disaster-open-card.component';

describe('DisasterOpenCardComponent', () => {
  let component: DisasterOpenCardComponent;
  let fixture: ComponentFixture<DisasterOpenCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
