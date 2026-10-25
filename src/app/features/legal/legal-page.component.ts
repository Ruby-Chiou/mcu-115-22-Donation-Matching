import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { LEGAL_DOCUMENTS, LegalDocument } from './legal-documents';

@Component({
  selector: 'app-legal-page',
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private subscription?: Subscription;

  protected document: LegalDocument | null = null;

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      this.document = LEGAL_DOCUMENTS[params.get('page') ?? ''] ?? null;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
