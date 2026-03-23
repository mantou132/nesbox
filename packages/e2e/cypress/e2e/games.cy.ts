import { prepare } from 'cypress/prepare';

context('Start cypress test', () => {
  before(() => prepare('/games'));

  it('Favorite', () => {
    cy.deep('m-game-item:not([favorited])').then(($item) => {
      cy.wrap($item).find('[data-cy=favorite]').click({ force: true });
      cy.wrap($item).should('have.attr', 'favorited');
      cy.wrap($item).find('[data-cy=favorite]').click({ force: true });
      cy.wrap($item).should('not.have.attr', 'favorited');
    });
  });
});
