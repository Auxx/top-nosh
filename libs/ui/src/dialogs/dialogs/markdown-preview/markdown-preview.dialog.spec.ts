import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { RemarkComponent } from 'ngx-remark';
import { MarkdownPreviewDialog, MarkdownPreviewDialogData } from './markdown-preview.dialog';

describe('MarkdownPreviewDialog', () => {
  let component: MarkdownPreviewDialog;
  let fixture: ComponentFixture<MarkdownPreviewDialog>;
  let dialogRefMock: { close: jest.Mock; };

  const defaultData: MarkdownPreviewDialogData = {
    markdown: '# Title\nSome content'
  };

  const createComponent = async (data: MarkdownPreviewDialogData = defaultData) => {
    dialogRefMock = {
      close: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ MarkdownPreviewDialog ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownPreviewDialog);
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

  it('should render default title and remark component when markdown is provided', async () => {
    await createComponent({ markdown: '# Hello world' });

    const titleEl: HTMLElement = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(titleEl.textContent?.trim()).toBe('Description Preview');

    const remarkDebugEl = fixture.debugElement.query(By.directive(RemarkComponent));
    expect(remarkDebugEl).toBeTruthy();
    expect(remarkDebugEl.componentInstance.markdown()).toBe('# Hello world');
  });

  it('should render custom title if provided', async () => {
    await createComponent({ title: 'Custom Preview', markdown: 'Some markdown' });

    const titleEl: HTMLElement = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(titleEl.textContent?.trim()).toBe('Custom Preview');
  });

  it('should render fallback empty state when markdown is empty', async () => {
    await createComponent({ markdown: '' });

    const remarkDebugEl = fixture.debugElement.query(By.directive(RemarkComponent));
    expect(remarkDebugEl).toBeFalsy();

    const emptyStateEl: HTMLElement = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyStateEl).toBeTruthy();
    expect(emptyStateEl.textContent?.trim()).toBe('No description provided.');
  });

  it('should close dialog when clicking close button', async () => {
    await createComponent();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('mat-dialog-actions button');
    button.click();

    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});
