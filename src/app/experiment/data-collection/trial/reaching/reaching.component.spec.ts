import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachingComponent } from './reaching.component';

describe('ReachingComponent', () => {
  let component: ReachingComponent;
  let fixture: ComponentFixture<ReachingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReachingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReachingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
