import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Task } from "@shared/models/task.model";

@Injectable({
  providedIn: "root",
})
export class StepsService {
  steps: Task[] = [];
  /* = [
    { name: 'Online Consultation', status: 'inprogress', index: 0 }, 
    { name: 'Agreement', status: 'incomplete', index: 1 },
    { name: 'Consultation Type', status: 'incomplete', index: 2 },
    { name: 'Name and Address', status: 'incomplete', index: 3 },
    { name: 'Country of Citizenship', status: 'incomplete', index: 4 },
    { name: 'Purpose of Consultation', status: 'incomplete', index: 5 },
    { name: 'Review', status: 'incomplete', index: 6 }
  ];
*/
  currTask?: Task;
  nextTask?: Task;
  lastTask?: Task;

  private mockTasksSubject = new BehaviorSubject<Task[]>(this.steps);

  get mockTasks$(): Observable<Task[]> {
    return this.mockTasksSubject.asObservable();
  }

  constructor() {}

  currentIndex(): number {
    if (this.currTask) {
      if (typeof this.currTask.index !== "undefined") {
        return this.currTask.index;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  stepForward() {
    this.findCurrTask();
    if (this.currTask) {
      if (
        typeof this.currTask.index !== "undefined" &&
        this.currTask.index !== null
      ) {
        if (this.currTask.index >= this.steps.length - 1) {
          return;
        }
        if (typeof this.currTask.index !== "undefined") {
          let index = this.currTask.index;
          this.nextTask = this.steps.find((s) => s.index == index + 1);
        }
      }
    }
    if (this.currTask) {
      this.currTask.status = "complete";
    }
    if (this.nextTask) {
      this.nextTask.status = "inprogress";
    }

    this.mockTasksSubject.next(this.steps);
  }

  setSteps(steps: Task[]) {
    this.steps = steps;
  }

  stepBackward() {
    this.findCurrTask();
    if (this.currTask) {
      if (this.currTask.index) {
        if (this.currTask.index <= 0) {
          return;
        }
      }
    }

    if (this.steps && this.currTask) {
      if (
        typeof this.currTask.index !== "undefined" &&
        this.currTask.index !== null
      ) {
        let index = this.currTask.index;
        this.lastTask = this.steps.find((s) => s.index == index - 1);
      }
      if (this.currTask) {
        this.currTask.status = "incomplete";
      }
      if (this.lastTask) {
        this.lastTask.status = "inprogress";
      }
    }
    this.mockTasksSubject.next(this.steps);
  }

  flush(): void {
    this.stepForward();
    this.stepBackward();
  }
  findCurrTask() {
    this.currTask = this.steps.find((s) => s.status == "inprogress");
  }
}
