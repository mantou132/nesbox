export const prepare = (pathname: string) => {
  cy.visit('/login');
  cy.deep('dy-light-route');
  cy.location('pathname').then((path) => {
    if (path !== pathname) {
      // .env CYPRESS_USERNAME
      cy.env(['USERNAME', 'PASSWORD']).then(({ USERNAME, PASSWORD }) => {
        cy.deep('input[name=username]').type(USERNAME);
        cy.deep('input[name=password]').type(PASSWORD);
        cy.deep('[data-cy=submit]').click();
        cy.deep('app-root');
      });
    }
  });
  cy.deep('nav').then(($nav) => {
    if ($nav.find('[data-cy=back]').length) {
      cy.deep('[data-cy=back]').click();
      cy.location('pathname').should('eq', pathname);
    }
  });
  cy.visit(pathname);
};
