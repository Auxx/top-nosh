import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { RemarkComponent } from 'ngx-remark';
import { NEVER, Observable } from 'rxjs';
import { getTranslocoModule } from '../../transloco-testing.module';
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
      imports: [
        MarkdownPreviewDialog,
        getTranslocoModule({
          langs: {
            en: {
              ui: {
                Confirmation: { confirm: 'Yes', cancel: 'No' },
                MarkdownPreview: {
                  title: 'Description Preview',
                  empty: 'No Markdown content was provided.',
                  close: 'Close'
                }
              }
            },
            ru: { ui: { Confirmation: { confirm: 'Да', cancel: 'Нет' } } }
          },
          translocoConfig: { availableLangs: [ 'en', 'ru' ], defaultLang: 'en' }
        })
      ],
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
    expect(emptyStateEl.textContent?.trim()).toBe('No Markdown content was provided.');
  });

  it('should close dialog when clicking close button', async () => {
    await createComponent();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('mat-dialog-actions button');
    button.click();

    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('should render the close button label from translations', async () => {
    await createComponent();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('mat-dialog-actions button');
    expect(button.textContent?.trim()).toBe('Close');
  });

  it('should render the caller content and close button before translations load', async () => {
    class NeverLoader implements TranslocoLoader {
      getTranslation(): Observable<Translation> {
        return NEVER;
      }
    }

    await TestBed.configureTestingModule({
      imports: [ MarkdownPreviewDialog ],
      providers: [
        provideTransloco({ config: { availableLangs: [ 'en' ], defaultLang: 'en' }, loader: NeverLoader }),
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Custom Preview', markdown: '# Hi' } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownPreviewDialog);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[mat-dialog-title]')?.textContent.trim()).toBe('Custom Preview');
    expect(fixture.debugElement.query(By.directive(RemarkComponent))).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mat-dialog-actions button')).toBeTruthy();
  });
});
