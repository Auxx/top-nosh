import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookingStagesComponent } from './cooking-stages.component';

describe('CookingStagesComponent', () => {
  let component: CookingStagesComponent;
  let fixture: ComponentFixture<CookingStagesComponent>;

  const recipe = {
    stages: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CookingStagesComponent ]
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
