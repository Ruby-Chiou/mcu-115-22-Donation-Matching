import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenPageComponent } from './disaster-open-page.component';

describe('DisasterOpenPageComponent', () => {
  let component: DisasterOpenPageComponent;
  let fixture: ComponentFixture<DisasterOpenPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
