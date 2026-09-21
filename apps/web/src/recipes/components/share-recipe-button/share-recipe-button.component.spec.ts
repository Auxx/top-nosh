import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { ShareRecipeButtonComponent } from './share-recipe-button.component';

describe('ShareRecipeButtonComponent', () => {
  let component: ShareRecipeButtonComponent;
  let fixture: ComponentFixture<ShareRecipeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ShareRecipeButtonComponent, getTranslocoModule() ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShareRecipeButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipeId', 'recipe-abc-123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an icon button by default', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="share-recipe-btn"]');
    expect(button).toBeTruthy();
    expect(button.querySelector('mat-icon')).toBeTruthy();
  });

  it('should render a text button with the share label when isIcon is false', () => {
    fixture.componentRef.setInput('isIcon', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="share-recipe-btn"]');
    expect(button).toBeTruthy();
    expect(button.querySelector('mat-icon')).toBeNull();
    expect(button.textContent).toContain('ShareRecipeButtonComponent.share');
  });

  it('should compute the correct share URL from recipeId', () => {
    const expectedUrl = `${window.location.protocol}//${window.location.host}/share/recipe/recipe-abc-123`;
    expect(component.shareUrl()).toBe(expectedUrl);
  });

  it('should copy the share URL to clipboard when clicked', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });

    const button = fixture.nativeElement.querySelector('[data-testid="share-recipe-btn"]') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    const expectedUrl = `${window.location.protocol}//${window.location.host}/share/recipe/recipe-abc-123`;
    expect(writeTextMock).toHaveBeenCalledWith(expectedUrl);
  });
});
