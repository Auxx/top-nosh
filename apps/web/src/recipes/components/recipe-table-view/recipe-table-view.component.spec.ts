import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MockComponent } from 'ng-mocks';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { RecipeListItem } from '../../models/recipe-list.types';
import { ShareRecipeButtonComponent } from '../share-recipe-button/share-recipe-button.component';
import { RecipeTableViewComponent } from './recipe-table-view.component';

describe('RecipeTableViewComponent', () => {
  let component: RecipeTableViewComponent;
  let fixture: ComponentFixture<RecipeTableViewComponent>;

  const sampleRecipes: RecipeListItem[] = [
    {
      id: '1',
      name: 'Spaghetti Bolognese',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Rich meat sauce with pasta.',
      thumbnail: null,
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

  const desktopColumns = [ 'name', 'description', 'cuisine', 'category', 'actions' ];
  const mobileColumns = [ 'name', 'actions' ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RecipeTableViewComponent,
        MockComponent(ShareRecipeButtonComponent),
        getTranslocoModule()
      ],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeTableViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipes', sampleRecipes);
    fixture.componentRef.setInput('columns', desktopColumns);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all desktop column headers', () => {
    const headers = fixture.nativeElement.querySelectorAll('th.mat-mdc-header-cell');
    expect(headers.length).toBe(5);
  });

  it('should render only mobile column headers when columns input is updated', () => {
    fixture.componentRef.setInput('columns', mobileColumns);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th.mat-mdc-header-cell');
    expect(headers.length).toBe(2);
  });

  it('should render recipe rows matching recipes input', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr.mat-mdc-row');
    expect(rows.length).toBe(2);

    const firstRowNameLink = rows[0].querySelector('a.label');
    expect(firstRowNameLink).toBeTruthy();
    expect(firstRowNameLink.textContent.trim()).toBe('Spaghetti Bolognese');
    expect(firstRowNameLink.getAttribute('href')).toBe('/recipes/1');

    const firstRowCuisine = rows[0].querySelector('.mat-column-cuisine');
    expect(firstRowCuisine.textContent.trim()).toBe('Italian');

    const firstRowCategory = rows[0].querySelector('.mat-column-category');
    expect(firstRowCategory.textContent.trim()).toBe('Pasta');
  });

  it('should strip markdown tokens in recipe description', () => {
    const markdownRecipe: RecipeListItem = {
      id: '10',
      name: 'Markdown Recipe',
      cuisine: 'Italian',
      category: 'Pasta',
      description: '# Amazing **Pasta** with [tasty sauce](https://example.com)',
      thumbnail: null,
      isShared: true
    };

    fixture.componentRef.setInput('recipes', [ markdownRecipe ]);
    fixture.detectChanges();

    const descriptionCell = fixture.nativeElement.querySelector('.item-description-medium');
    expect(descriptionCell).toBeTruthy();
    expect(descriptionCell.textContent.trim()).toBe('Amazing Pasta with tasty sauce');
  });

  it('should truncate descriptions longer than 100 characters with ellipsis', () => {
    const longText = 'A'.repeat(120);
    const longRecipe: RecipeListItem = {
      id: '11',
      name: 'Long Recipe',
      cuisine: 'Italian',
      category: 'Pasta',
      description: `**${longText}**`,
      thumbnail: null,
      isShared: true
    };

    fixture.componentRef.setInput('recipes', [ longRecipe ]);
    fixture.detectChanges();

    const descriptionCell = fixture.nativeElement.querySelector('.item-description-medium');
    expect(descriptionCell).toBeTruthy();
    expect(descriptionCell.textContent.trim()).toBe('A'.repeat(100) + '...');
  });

  it('should display empty state when recipes is empty', () => {
    fixture.componentRef.setInput('recipes', []);
    fixture.detectChanges();

    const emptyCell = fixture.nativeElement.querySelector('.empty-table-cell');
    expect(emptyCell).toBeTruthy();
    expect(emptyCell.textContent).toContain('RecipeListPage.noRecipes');

    const icon = emptyCell.querySelector('mat-icon.empty-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('menu_book');

    expect(emptyCell.getAttribute('colspan')).toBe(desktopColumns.length.toString());
  });

  it('should emit edit output when edit button is clicked', () => {
    const editSpy = jest.spyOn(component.edit, 'emit');
    const editButtons = fixture.nativeElement.querySelectorAll('td.actions button');
    (editButtons[0] as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalledWith(sampleRecipes[0]);
  });

  it('should emit delete output when delete button is clicked', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');
    const actionButtons = fixture.nativeElement.querySelectorAll('td.actions button');
    (actionButtons[1] as HTMLButtonElement).click();

    expect(deleteSpy).toHaveBeenCalledWith(sampleRecipes[0]);
  });

  it('should render ShareRecipeButtonComponent as the first action with the recipe id', () => {
    const actionsCell = fixture.nativeElement.querySelector('td.actions');
    expect(actionsCell.children[0].tagName.toLowerCase()).toBe('app-share-recipe-button');

    const shareDebugEl = fixture.debugElement.query(By.directive(ShareRecipeButtonComponent));
    expect(shareDebugEl.componentInstance.recipeId()).toBe('1');
  });

  it('should hide ShareRecipeButtonComponent when recipe is not shared', () => {
    const actionsCell = fixture.nativeElement.querySelectorAll('td.actions')[1];
    expect(actionsCell.querySelector('app-share-recipe-button')).toBeNull();
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
