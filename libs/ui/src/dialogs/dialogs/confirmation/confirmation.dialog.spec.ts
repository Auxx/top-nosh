import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialog, ConfirmationDialogData } from './confirmation.dialog';

describe('ConfirmationDialog', () => {
  let component: ConfirmationDialog;
  let fixture: ComponentFixture<ConfirmationDialog>;
  let dialogRefMock: { close: jest.Mock; };

  const defaultData: ConfirmationDialogData = {
    title: 'Test Title',
    content: 'Test message content'
  };

  const createComponent = async (data: ConfirmationDialogData = defaultData) => {
    dialogRefMock = {
      close: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ ConfirmationDialog ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should render custom title and content', async () => {
    await createComponent({
      title: 'Delete Recipe',
      content: 'Are you sure you want to delete this recipe?'
    });

    const titleEl: HTMLElement = fixture.nativeElement.querySelector('[mat-dialog-title]');
    const contentEl: HTMLElement = fixture.nativeElement.querySelector('mat-dialog-content');

    expect(titleEl.textContent?.trim()).toBe('Delete Recipe');
    expect(contentEl.textContent?.trim()).toBe('Are you sure you want to delete this recipe?');
  });

  it('should render default button labels when optional labels are omitted', async () => {
    await createComponent();

    const buttons = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('No');
    expect(buttons[1].textContent?.trim()).toBe('Yes');
  });

  it('should render custom button labels when provided', async () => {
    await createComponent({
      title: 'Confirm Action',
      content: 'Do you want to continue?',
      cancelText: 'Cancel',
      confirmText: 'Confirm'
    });

    const buttons = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Cancel');
    expect(buttons[1].textContent?.trim()).toBe('Confirm');
  });

  it('should close dialog with false when clicking the cancel button', async () => {
    await createComponent();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
    buttons[0].click();

    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when clicking the confirm button', async () => {
    await createComponent();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
    buttons[1].click();

    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});
