export class AuthError extends Error {
  constructor(message: string) {
    super(message || 'Authorization error!')
  }
}

export class BadTokenError extends AuthError {
  constructor() {
    super('Bad token!')
  }
}

export class UnauthorizedError extends AuthError {
  constructor() {
    super('Unauthorized!')
  }
}
