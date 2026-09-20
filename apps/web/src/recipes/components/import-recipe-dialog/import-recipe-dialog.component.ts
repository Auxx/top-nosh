import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { TranslocoDirective } from '@jsverse/transloco';
import { WhenError } from '@top-nosh/ui';

@Component({
  selector: 'app-import-recipe-dialog',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatDialogClose,
    TranslocoDirective,
    ReactiveFormsModule,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    WhenError
  ],
  templateUrl: './import-recipe-dialog.component.html',
  styleUrl: './import-recipe-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportRecipeDialogComponent {
  private readonly dialogRef = inject(MatDialogRef);

  private readonly validateUrl = (control: AbstractControl): ValidationErrors | null =>
    URL.canParse(control.value) ? null : { invalidUrl: true };

  readonly url = new FormControl('', { validators: [ Validators.required, this.validateUrl ], nonNullable: true });

  readonly form = new FormGroup({ url: this.url });

  readonly onSubmit = () => this.dialogRef.close(this.url.value);
}
