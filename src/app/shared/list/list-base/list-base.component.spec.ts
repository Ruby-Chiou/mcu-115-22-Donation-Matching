import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListBaseComponent } from './list-base.component';

describe('ListBaseComponent', () => {
  let component: ListBaseComponent;
  let fixture: ComponentFixture<ListBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListBaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListBaseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
