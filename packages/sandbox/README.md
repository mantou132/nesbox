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
nesbox.isTap(nesbox.buttons1.Start);
nesbox.isPressed(nesbox.buttons1.Start);
nesbox.cursorPosition(Player.One)；
```
