import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EventService } from '@modules/events/services/event.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [EventService],
})
export class EventModule {}
