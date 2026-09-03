import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterHistoryComponent } from './disaster-history.component';

describe('DisasterHistoryComponent', () => {
  let component: DisasterHistoryComponent;
  let fixture: ComponentFixture<DisasterHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterHistoryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
