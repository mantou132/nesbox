import 'cypress-wait-until';

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

const exec = () =>
  cy.window({ log: false }).then((win) => {
    win.eval(
      '(()=>{"use strict";var t={};function e(t){const e=[];for(const r of t){const t=r;t.shadowRoot&&e.push(t.shadowRoot)}return e}function r(t){return[...t,...e(t)]}function n(t){return e(l("*",t))}function o(t){return[...e(t),...n(t)]}function u(t,e){if(!t)return[];if(!e.length)return[];const r=[];r.push(...e.map((e=>[...e.querySelectorAll(t)])).flat());const n=t.split(" ").filter((t=>!!t.trim()));let l="";for(let c=0;c<n.length;c++){const i=o(0===c?e:e.map((t=>[...t.querySelectorAll(l)])).flat());0!==c&&r.push(...u(n.slice(c).join(" "),i)),r.push(...u(t,i)),l=`${l} ${n[c]}`}return r}function l(t,e){if(!t.trim())throw new Error(`\'${t}\' is not a valid selector`);if(t.includes(">>>")){const r=t.split(">>>");if(r.length>2)throw new Error("Cannot use multiple `>>>`");if(r[1]&&r[1].includes(">>"))throw new Error("Cannot use `>>` after `>>>`");if(!r[1].trim())throw new Error("Cannot be empty after `>>>`");const n=r[0].trim()?l(r[0],e):e,o=u(r[1],n);return[...new Set(o)]}{const o=t.split(">>");if(!o[o.length-1].trim())throw new Error("Cannot be empty after `>>`");return o.reduce(((t,e,u)=>{if(!e.trim())return r(t);const l=u===o.length-1;return t.map((t=>{const o=[...t.querySelectorAll(e)];return l?o:function(t){return[...r(t),...n(t)]}(o)})).flat()}),e)}}function c(t,e){return l(t,e)[0]||null}t.d=(e,r)=>{for(var n in r)t.o(r,n)&&!t.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:r[n]})},t.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),Document.prototype.deepQuerySelectorAll=function(t){return l(t,[this])},Document.prototype.deepQuerySelector=function(t){return c(t,[this])},Element.prototype.deepQuerySelectorAll=function(t){return l(t,[this])},Element.prototype.deepQuerySelector=function(t){return c(t,[this])},document.deepQuerySelector.bind(document),document.deepQuerySelectorAll.bind(document)})();',
    );
  });

Cypress.Commands.add('deep', (selector: string) => {
  exec();

  cy.waitUntil(
    () =>
      cy.window({ log: false }).then((win) => {
        const result = win.eval(`document.deepQuerySelector(">>> ${selector}")`);
        return result && cy.wrap(result);
      }),
    { log: false },
  );
});
