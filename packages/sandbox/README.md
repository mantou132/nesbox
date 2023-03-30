# Sandbox

A secure runtime for running JavaScript games in NESBox.

## Example

```js
nesbox.init({
  width: 256,
  height: 240,
  getVideoFrame: () => {
    return getVideoFrame();
  },
  getAudioFrame: () => {
    return getAudioFrame();
  },
  getState: () => {
    return getState();
  },
  setState: (state) => {
    setState(state);
  },
});
```

Read user input:

```js
nesbox.isTap(nesbox.players.One, nesbox.buttons.Start);
nesbox.isPressed(nesbox.players.One, nesbox.buttons.Start);
nesbox.cursorPosition(nesbox.players.One)；
```
