import { Component } from '@angular/core';
import { LoaderService } from '../loader.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent {
  isLoading$!: Observable<boolean>; // 👈 Non-null assertion
  progress$!: Observable<number>;
  circles = Array(6)
    .fill(0)
    .map((_, i) => i);
  constructor(private loaderService: LoaderService) {
    this.isLoading$ = this.loaderService.loading$;
    this.progress$ = this.loaderService.progress$;
  }
}
