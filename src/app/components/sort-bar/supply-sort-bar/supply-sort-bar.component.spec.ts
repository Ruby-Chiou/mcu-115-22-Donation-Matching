import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplySortBarComponent } from './supply-sort-bar.component';

describe('SupplySortBarComponent', () => {
  let component: SupplySortBarComponent;
  let fixture: ComponentFixture<SupplySortBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplySortBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplySortBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
