import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AnimationsRoutingModule } from './animations-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [CommonModule, AnimationsRoutingModule],
  declarations: [HomeComponent],
})
export class AnimationsModule {}
