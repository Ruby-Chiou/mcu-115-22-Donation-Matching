import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandListComponent } from './demand-list.component';

describe('DemandListComponent', () => {
  let component: DemandListComponent;
  let fixture: ComponentFixture<DemandListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DemandListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
