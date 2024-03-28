import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixationComponent } from './fixation.component';

describe('FixationComponent', () => {
  let component: FixationComponent;
  let fixture: ComponentFixture<FixationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FixationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FixationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
