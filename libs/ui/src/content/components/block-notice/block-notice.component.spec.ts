import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatIcon } from '@angular/material/icon';
import { MockComponents } from 'ng-mocks';
import { BlockNoticeComponent } from './block-notice.component';

describe('BlockNoticeComponent', () => {
  let component: BlockNoticeComponent;
  let fixture: ComponentFixture<BlockNoticeComponent>;

  beforeEach(async () => {
    await TestBed
      .configureTestingModule({
        imports: [
          BlockNoticeComponent,
          MockComponents(MatIcon)
        ]
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlockNoticeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'icon');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
