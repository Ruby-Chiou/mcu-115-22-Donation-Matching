import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { HelperFormComponent } from './helper-form.component';

describe('HelperFormComponent', () => {
  let component: HelperFormComponent;
  let fixture: ComponentFixture<HelperFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperFormComponent);
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
