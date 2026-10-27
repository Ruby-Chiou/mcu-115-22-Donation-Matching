import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelperDetailComponent } from './helper-detail.component';

describe('HelperDetailComponent', () => {
  let component: HelperDetailComponent;
  let fixture: ComponentFixture<HelperDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
