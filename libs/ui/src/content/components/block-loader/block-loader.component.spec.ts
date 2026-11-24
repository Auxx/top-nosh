import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '../../../transloco-testing.module';

import { BlockLoaderComponent } from './block-loader.component';

describe('BlockLoaderComponent', () => {
  let component: BlockLoaderComponent;
  let fixture: ComponentFixture<BlockLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BlockLoaderComponent,
        getTranslocoModule({ langs: { en: { ui: { BlockLoader: { loading: 'Loading...' } } } } })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BlockLoaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the translated loading text', () => {
    expect(fixture.nativeElement.querySelector('p').textContent.trim()).toBe('Loading...');
  });
});
