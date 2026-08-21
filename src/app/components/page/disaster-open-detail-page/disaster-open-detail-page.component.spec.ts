import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenDetailPageComponent } from './disaster-open-detail-page.component';

describe('DisasterOpenDetailPageComponent', () => {
  let component: DisasterOpenDetailPageComponent;
  let fixture: ComponentFixture<DisasterOpenDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenDetailPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenDetailPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
