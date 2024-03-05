class CustomValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomValidationException";
  }
}

class NotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundException";
  }
}

export { CustomValidationException, NotFoundException };
