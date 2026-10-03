import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InspectionResult } from '../../models/ai-inspection/inspection-reault';

@Injectable({
  providedIn: 'root',
})
export class InspectionService {
  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:8000';

  inspectImage(image: File, itemCondition: 'new' | 'used'): Observable<InspectionResult> {
    const formData = new FormData();

    formData.append('image', image);

    formData.append('item_condition', itemCondition);

    return this.http.post<InspectionResult>(`${this.apiUrl}/inspect`, formData);
  }
}
