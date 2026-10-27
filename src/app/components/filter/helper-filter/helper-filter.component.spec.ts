import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelperFilterComponent } from './helper-filter.component';

describe('HelperFilterComponent', () => {
  let component: HelperFilterComponent;
  let fixture: ComponentFixture<HelperFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
