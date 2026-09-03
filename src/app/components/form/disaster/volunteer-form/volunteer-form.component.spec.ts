import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { VolunteerFormComponent } from './volunteer-form.component';

describe('VolunteerFormComponent', () => {
  let component: VolunteerFormComponent;
  let fixture: ComponentFixture<VolunteerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the cancel modal in edit mode', () => {
    component.isEditMode = true;

    component.onCancel();

    expect(component.showCancelModal).toBe(true);
  });

  it('should navigate away after confirming cancellation', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.isEditMode = true;
    component.onCancel();
    component.confirmCancel();

    expect(navigateSpy).toHaveBeenCalledWith(['/agency/disaster']);
    expect(component.showCancelModal).toBe(false);
  });
});
