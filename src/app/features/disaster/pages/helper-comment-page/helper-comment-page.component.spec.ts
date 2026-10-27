import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelperCommentPageComponent } from './helper-comment-page.component';

describe('HelperCommentPageComponent', () => {
  let component: HelperCommentPageComponent;
  let fixture: ComponentFixture<HelperCommentPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperCommentPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperCommentPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
