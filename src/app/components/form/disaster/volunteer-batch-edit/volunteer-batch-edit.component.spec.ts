import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerBatchEditComponent } from './volunteer-batch-edit.component';

describe('VolunteerBatchEditComponent', () => {
  let component: VolunteerBatchEditComponent;
  let fixture: ComponentFixture<VolunteerBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerBatchEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerBatchEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
