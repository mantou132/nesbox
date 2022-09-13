export const prepare = (pathname: string) => {
  cy.visit(pathname);
  cy.deep('dy-route');
  cy.location('pathname').then((path) => {
    if (path !== pathname) {
      // .env CYPRESS_USERNAME
      cy.deep('input[name=username]').type(Cypress.env('USERNAME'));
      cy.deep('input[name=password]').type(Cypress.env('PASSWORD'));
      cy.deep('[data-cy=submit]').click();
      cy.deep('app-root');
    }
  });
  cy.deep('nav').then(($nav) => {
    if ($nav.find('[data-cy=back]').length) {
      cy.deep('[data-cy=back]').click();
      cy.location('pathname').should('eq', pathname);
    }
  });
};
