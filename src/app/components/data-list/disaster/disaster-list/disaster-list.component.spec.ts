import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterListComponent } from './disaster-list.component';

describe('DemandListComponent', () => {
  let component: DisasterListComponent;
  let fixture: ComponentFixture<DisasterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
