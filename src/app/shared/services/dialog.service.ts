import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../../mat-confirm-dialog/mat-confirm-dialog.component';
import { DialogPopUpComponent } from '../../dialog-pop-up/dialog-pop-up.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openConfirmDialog(title: any, msg: any, btn1: any, btn2: any) {
    return this.dialog.open(MatConfirmDialogComponent, {
      width: '350px',
      disableClose: true,
      data: {
        title: title,
        message: msg,
        button1: btn1,
        button2: btn2,
      },
    });
  }
  openInputDialog(
    title: string,
    message: string,
    placeholder: string,
    confirmButton: string,
    cancelButton: string
  ) {
    return this.dialog.open(DialogPopUpComponent, {
      width: '450px',
      disableClose: true,
      data: {
        title: title,
        message: message,
        placeholder: placeholder,
        confirmButton: confirmButton,
        cancelButton: cancelButton,
      },
    });
  }
}
