import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '../../../system/transloco-testing.module';

import { CookingStagesComponent } from './cooking-stages.component';

describe('CookingStagesComponent', () => {
  let component: CookingStagesComponent;
  let fixture: ComponentFixture<CookingStagesComponent>;

  const recipe = {
    stages: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CookingStagesComponent,
        getTranslocoModule()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CookingStagesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', recipe);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
