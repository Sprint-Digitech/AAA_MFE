import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type OrbitCodeState = 'idle' | 'verifying' | 'success' | 'error';

interface Slot { i: number; rx: number; ry: number; cx: number; cy: number; }

/**
 * Glassy one-time-code input (2FA / MPIN):
 *  - idle      : glass boxes in a row, the next one glows with a caret
 *  - verifying : the boxes fly onto a dashed ring and orbit a pulsing hub
 *  - success   : they collapse into a green check with rings + sparks
 *  - error     : back to the row, tinted red, with a shake
 * A single real <input> (numeric, autocomplete="one-time-code") sits over the
 * boxes, so typing, paste and browser/OS code autofill all just work.
 */
@Component({
  selector: 'app-orbit-code',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="oc" [attr.data-state]="state" [class.masked]="masked" [style.--n]="length"
     (click)="focus()">
  <div class="oc-stage" [style.width.px]="stageW">
    <div class="oc-orbit">
      <svg class="oc-ring" viewBox="-100 -100 200 200" aria-hidden="true">
        <circle r="78" pathLength="100" />
      </svg>
      <span class="oc-hub"></span>
      <span *ngFor="let s of slots; trackBy: trackByI" class="oc-box"
            [class.filled]="value.length > s.i"
            [class.active]="state === 'idle' && focused && value.length === s.i"
            [style.--rx.px]="s.rx" [style.--ry.px]="s.ry"
            [style.--cx.px]="s.cx" [style.--cy.px]="s.cy"
            [style.--d]="s.i">
        <b *ngIf="value.length > s.i">{{ masked ? '•' : value[s.i] }}</b>
        <i *ngIf="state === 'idle' && focused && value.length === s.i" class="oc-caret"></i>
      </span>
    </div>

    <div class="oc-done" aria-hidden="true">
      <span class="oc-sq oc-sq--3"></span>
      <span class="oc-sq oc-sq--2"></span>
      <span class="oc-check">
        <svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg>
      </span>
      <span *ngFor="let p of sparks" class="oc-spark" [style.--a.deg]="p.a" [style.--r.px]="p.r" [style.--sd.ms]="p.d"></span>
    </div>
  </div>

  <input #input class="oc-input" type="text" inputmode="numeric" autocomplete="one-time-code"
         [attr.maxlength]="length" [attr.aria-label]="ariaLabel" [disabled]="disabled || state === 'verifying' || state === 'success'"
         [value]="value" (input)="onInput($event)" (focus)="focused = true" (blur)="focused = false"
         (keydown.enter)="emitIfComplete()" />
</div>
`,
  styleUrls: ['./orbit-code.component.scss'],
})
export class OrbitCodeComponent implements OnChanges {
  @Input() length = 6;
  @Input() value = '';
  @Input() state: OrbitCodeState = 'idle';
  @Input() disabled = false;
  /** Show dots instead of digits (MPIN). */
  @Input() masked = false;
  @Input() ariaLabel = 'Verification code';
  @Input() autofocus = true;

  @Output() valueChange = new EventEmitter<string>();
  /** Fired once every box is filled. */
  @Output() completed = new EventEmitter<string>();

  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  slots: Slot[] = [];
  sparks: { a: number; r: number; d: number }[] = [];
  stageW = 300;
  focused = false;

  private readonly box = 46;
  private readonly gap = 10;
  private readonly radius = 78;

  constructor() {
    this.build();
    // Fixed, pre-computed sparks (no allocation during change detection).
    this.sparks = Array.from({ length: 14 }, (_, k) => ({
      a: k * (360 / 14) + (k % 2 ? 9 : -6),
      r: 84 + ((k * 37) % 30),
      d: (k * 53) % 420,
    }));
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['length']) this.build();
    if (ch['value'] && this.value == null) this.value = '';
    if (ch['state'] && this.state === 'idle' && !ch['state'].firstChange) {
      setTimeout(() => this.focus(), 30);
    }
  }

  ngAfterViewInit(): void {
    if (this.autofocus) setTimeout(() => this.focus(), 80);
  }

  trackByI = (_: number, s: Slot) => s.i;

  focus(): void {
    const el = this.input?.nativeElement;
    if (el && !el.disabled) el.focus();
  }

  onInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const digits = (el.value || '').replace(/\D/g, '').slice(0, this.length);
    if (el.value !== digits) el.value = digits;
    this.value = digits;
    this.valueChange.emit(digits);
    this.emitIfComplete();
  }

  emitIfComplete(): void {
    if (this.value.length === this.length && this.state !== 'verifying' && this.state !== 'success') {
      this.completed.emit(this.value);
    }
  }

  private build(): void {
    const n = Math.max(1, this.length);
    const box = n > 6 ? 40 : this.box;
    const rowW = n * box + (n - 1) * this.gap;
    this.stageW = Math.max(rowW + 8, 2 * this.radius + box + 16);
    this.slots = Array.from({ length: n }, (_, i) => {
      const angle = (-90 + (i * 360) / n) * (Math.PI / 180);
      return {
        i,
        rx: -rowW / 2 + box / 2 + i * (box + this.gap),
        ry: 0,
        cx: Math.round(Math.cos(angle) * this.radius),
        cy: Math.round(Math.sin(angle) * this.radius),
      };
    });
  }
}
