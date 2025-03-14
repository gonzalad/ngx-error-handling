import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { safeSignal } from '@gonzal/ngx-error-handling';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'test-app';
  value = model<number>(0);
  computedValue = safeSignal(() => {
    const result = this.value() % 2;
    if (result !== 0) {
      throw new Error('value should be %2');
    }
    return result;
  });

  clickMe() {
    // this will execute a changeDetection cycle
    // and allow to see if a new error is generated
  }
}
