import { AbstractControl, ValidatorFn } from "@angular/forms";

export function cardNumberValidator(
  component: any,
  config: object,
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    let valid = false;
    const cardNumber = control.value;
    if (typeof cardNumber === "undefined" || cardNumber === null) {
      return null;
    }
    if (cardNumber.length < 1 || cardNumber === "") {
      return null;
    }
    valid = component.validCardNumber(cardNumber);
    return valid ? null : { cardNumberInvalid: true };
  };
}
