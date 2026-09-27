import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockNoticeComponent } from './block-notice.component';

describe('BlockNoticeComponent', () => {
  let component: BlockNoticeComponent;
  let fixture: ComponentFixture<BlockNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ BlockNoticeComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BlockNoticeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
