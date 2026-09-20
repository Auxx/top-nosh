import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { getTranslocoModule } from '../../../system/transloco-testing.module';

import { ImportRecipeDialogComponent } from './import-recipe-dialog.component';

describe('ImportRecipeDialogComponent', () => {
  let component: ImportRecipeDialogComponent;
  let fixture: ComponentFixture<ImportRecipeDialogComponent>;

  const dialogRef = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ImportRecipeDialogComponent,
        getTranslocoModule()
      ],
      providers: [ { provide: MatDialogRef, useValue: dialogRef } ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ImportRecipeDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
