import { TestBed } from '@angular/core/testing';
import { AiChatComponent } from './ai-chat.component';

describe('AiChatComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatComponent],
    }).compileComponents();
  });

  it('should extract a direct answer string from the API response', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    const component = fixture.componentInstance;

    const result = (component as any).extractAssistantReply({ answer: ' 你好，我可以幫忙。 ' });

    expect(result).toBe('你好，我可以幫忙。');
  });

  it('should extract a nested answer from a wrapped response object', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    const component = fixture.componentInstance;

    const result = (component as any).extractAssistantReply({ data: { answer: '這是巢狀回覆' } });

    expect(result).toBe('這是巢狀回覆');
  });

  it('should return a fallback for invalid non-string responses', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    const component = fixture.componentInstance;

    const result = (component as any).extractAssistantReply({ answer: { text: 'not a string' } });

    expect(result).toBe('');
  });
});
