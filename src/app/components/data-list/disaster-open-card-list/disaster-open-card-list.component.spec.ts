import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenCardListComponent } from './disaster-open-card-list.component';

describe('DisasterOpenCardListComponent', () => {
  let component: DisasterOpenCardListComponent;
  let fixture: ComponentFixture<DisasterOpenCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenCardListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenCardListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
