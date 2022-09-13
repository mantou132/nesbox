import type {} from 'cypress';
import { prepare } from 'cypress/prepare';

context('Start cypress test', () => {
  before(() => prepare('/games'));

  it('Favorite', () => {
    cy.deep('m-game-item:not([favorited])').then(($item) => {
      cy.wrap($item).shadow().find('[data-cy=favorite]').click();
      cy.wrap($item).should('have.attr', 'favorited');
      cy.wrap($item).shadow().find('[data-cy=favorite]').click();
      cy.wrap($item).should('not.have.attr', 'favorited');
    });
  });
});
