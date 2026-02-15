import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// Input Dialog Component
@Component({
  selector: 'app-dialog-pop-up',
  imports: [
    MatDialogModule,
    CommonModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>{{ data.placeholder }}</mat-label>
        <textarea
          matInput
          [(ngModel)]="inputValue"
          placeholder="{{ data.placeholder }}"
          rows="4"
          maxlength="500"
        >
        </textarea>
        <mat-hint>{{ inputValue.length }}/500</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">
        {{ data.cancelButton }}
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="inputValue">
        {{ data.confirmButton }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogPopUpComponent {
  inputValue: string = '';

  constructor(
    public dialogRef: MatDialogRef<DialogPopUpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}

// Dialog Service
@Injectable()
export class DialogService {
  constructor(private dialog: MatDialog) {}
}
