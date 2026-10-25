import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterCommentPageComponent } from './disaster-comment-page.component';

describe('DisasterCommentPageComponent', () => {
  let component: DisasterCommentPageComponent;
  let fixture: ComponentFixture<DisasterCommentPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterCommentPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterCommentPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
