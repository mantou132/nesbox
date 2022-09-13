declare namespace Cypress {
  interface Chainable {
    deep(selector: string): Chainable<JQuery<HTMLElement>>;
  }
}
