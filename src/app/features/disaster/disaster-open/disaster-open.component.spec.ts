import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenComponent } from './disaster-open.component';

describe('DisasterOpenComponent', () => {
  let component: DisasterOpenComponent;
  let fixture: ComponentFixture<DisasterOpenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
