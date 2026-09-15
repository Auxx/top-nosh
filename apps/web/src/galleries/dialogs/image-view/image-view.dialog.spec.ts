import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageView, ImageViewData, ImageViewDialog, ImageViewDialogData } from './image-view.dialog';

describe('ImageView', () => {
  let component: ImageView;
  let fixture: ComponentFixture<ImageView>;
  let dialogRefMock: { close: jest.Mock; };

  const defaultData: ImageViewDialogData = {
    imageUrl: 'https://example.com/test-image.jpg'
  };

  const createComponent = async (data: ImageViewDialogData = defaultData) => {
    dialogRefMock = {
      close: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ ImageView ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageView);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the dialog component', async () => {
    await createComponent();
    expect(component).toBeTruthy();
    expect(component.data.imageUrl).toBe(defaultData.imageUrl);
  });

  it('should render the image with the provided imageUrl', async () => {
    const testUrl = 'https://example.com/custom-photo.png';
    await createComponent({ imageUrl: testUrl });

    const imgEl: HTMLImageElement | null = fixture.nativeElement.querySelector('img.full-image');
    expect(imgEl).toBeTruthy();
    expect(imgEl?.src).toBe(testUrl);
    expect(imgEl?.alt).toBe('Full size view');
  });

  it('should not render img tag when imageUrl is empty', async () => {
    await createComponent({ imageUrl: '' });

    const imgEl: HTMLImageElement | null = fixture.nativeElement.querySelector('img.full-image');
    expect(imgEl).toBeNull();
  });

  it('should close dialog when clicking the close button', async () => {
    await createComponent();

    const closeBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.close-button');
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();

    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('should support ImageViewDialog alias and ImageViewData type', () => {
    expect(ImageViewDialog).toBe(ImageView);
    const mockData: ImageViewData = { imageUrl: 'https://example.com/alias-test.jpg' };
    expect(mockData.imageUrl).toBe('https://example.com/alias-test.jpg');
  });
});
