import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponents } from 'ng-mocks';
import { GlanceStagesComponent } from '../glance-stages/glance-stages.component';
import { IngredientListComponent } from '../ingredient-list/ingredient-list.component';

import { GlanceComponent } from './glance.component';

describe('GlanceComponent', () => {
  let component: GlanceComponent;
  let fixture: ComponentFixture<GlanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GlanceComponent,
        MockComponents(
          IngredientListComponent,
          GlanceStagesComponent
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GlanceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', {});
    fixture.componentRef.setInput('servings', 1);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
