import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EventRoutingModule } from "./event-routing.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EventService } from "@modules/events/services/event.service";

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [EventService],
})
export class EventModule {}
