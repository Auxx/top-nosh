import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MockComponent } from 'ng-mocks';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { RecipeListItem } from '../../models/recipe-list.types';
import { ShareRecipeButtonComponent } from '../share-recipe-button/share-recipe-button.component';
import { RecipeGridViewComponent } from './recipe-grid-view.component';

describe('RecipeGridViewComponent', () => {
  let component: RecipeGridViewComponent;
  let fixture: ComponentFixture<RecipeGridViewComponent>;

  const sampleRecipes: RecipeListItem[] = [
    {
      id: '1',
      name: 'Spaghetti Bolognese',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Rich meat sauce with pasta.',
      thumbnail: 'https://cdn.example.com/spaghetti.jpg',
      isShared: true
    },
    {
      id: '2',
      name: 'Margherita Pizza',
      cuisine: 'Italian',
      category: 'Pizza',
      description: 'Classic cheese and tomato pizza.',
      thumbnail: null,
      isShared: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RecipeGridViewComponent,
        MockComponent(ShareRecipeButtonComponent),
        getTranslocoModule()
      ],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeGridViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipes', sampleRecipes);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a card per recipe with name, cuisine, and linked title', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards.length).toBe(2);

    const firstTitleLink = cards[0].querySelector('mat-card-title a');
    expect(firstTitleLink.textContent.trim()).toBe('Spaghetti Bolognese');
    expect(firstTitleLink.getAttribute('href')).toBe('/recipes/1');

    const firstSubtitle = cards[0].querySelector('mat-card-subtitle');
    expect(firstSubtitle.textContent.trim()).toBe('Italian');
  });

  it('should render an image when thumbnail is present', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    const image = cards[0].querySelector('img');

    expect(image).toBeTruthy();
    expect(image.getAttribute('src')).toBe('https://cdn.example.com/spaghetti.jpg');
  });

  it('should render a photo icon placeholder when thumbnail is null', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    const placeholderIcon = cards[1].querySelector('.image-placeholder mat-icon');

    expect(placeholderIcon).toBeTruthy();
    expect(placeholderIcon.textContent.trim()).toBe('photo');
  });

  it('should strip markdown tokens and truncate descriptions longer than 100 characters', () => {
    const longText = 'A'.repeat(120);
    fixture.componentRef.setInput('recipes', [
      {
        id: '10',
        name: 'Markdown Recipe',
        cuisine: 'Italian',
        category: 'Pasta',
        description: `**${longText}**`,
        thumbnail: null,
        isShared: true
      }
    ]);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('mat-card-content');
    expect(content.textContent.trim()).toBe('A'.repeat(100) + '...');
  });

  it('should display empty state when recipes is empty', () => {
    fixture.componentRef.setInput('recipes', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('RecipeListPage.noRecipes');
  });

  it('should emit edit output when edit button is clicked', () => {
    const editSpy = jest.spyOn(component.edit, 'emit');
    const editButtons = fixture.nativeElement.querySelectorAll('mat-card-actions button');
    (editButtons[0] as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalledWith(sampleRecipes[0]);
  });

  it('should emit delete output when delete button is clicked', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');
    const actionButtons = fixture.nativeElement.querySelectorAll('mat-card-actions button');
    (actionButtons[1] as HTMLButtonElement).click();

    expect(deleteSpy).toHaveBeenCalledWith(sampleRecipes[0]);
  });

  it('should render ShareRecipeButtonComponent as the second card action with isIcon false', () => {
    const actions = fixture.nativeElement.querySelectorAll('mat-card-actions')[0];
    expect(actions.children[1].tagName.toLowerCase()).toBe('app-share-recipe-button');

    const shareDebugEl = fixture.debugElement.query(By.directive(ShareRecipeButtonComponent));
    expect(shareDebugEl.componentInstance.recipeId()).toBe('1');
    expect(shareDebugEl.componentInstance.isIcon()).toBe(false);
  });

  it('should hide ShareRecipeButtonComponent when recipe is not shared', () => {
    const actions = fixture.nativeElement.querySelectorAll('mat-card-actions')[1];
    expect(actions.querySelector('app-share-recipe-button')).toBeNull();
  });

  it('should emit edit event via onEditRecipe', () => {
    const editSpy = jest.spyOn(component.edit, 'emit');
    component.onEditRecipe(sampleRecipes[0]);
    expect(editSpy).toHaveBeenCalledWith(sampleRecipes[0]);
  });

  it('should emit delete event via onDeleteRecipe', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');
    component.onDeleteRecipe(sampleRecipes[0]);
    expect(deleteSpy).toHaveBeenCalledWith(sampleRecipes[0]);
  });
});
