import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  createStore,
  connectStore,
  updateStore,
} from '@mantou/gem';

import { configure } from 'src/configure';
import { icons } from 'src/icons';
import { theme } from 'src/theme';
import { sendSDP } from 'src/services/api';
import { events, SDPEvent } from 'src/constants';
import { logger } from 'src/logger';

import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  .icon {
    width: 1.3em;
    padding: 0.2em;
    border-radius: ${theme.smallRound};
  }
  .icon:hover {
    background: ${theme.lightBackgroundColor};
  }
`);

export const voiceStore = createStore<{ audioLevel: Record<number, number> }>({
  audioLevel: {},
});

type State = {
  joined: boolean;
};

/**
 * @customElement m-room-voice
 */
@customElement('m-room-voice')
@adoptedStyle(style)
@connectStore(configure)
export class MVoiceRoomElement extends GemElement<State> {
  state: State = {
    joined: false,
  };

  #toggleVoice = () => {
    this.setState({ joined: !this.state.joined });
  };

  #audioEle = document.createElement('audio');

  mounted = () => {
    this.effect(
      ([roomId]) => {
        if (roomId && this.state.joined) {
          const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          peerConnection.addTransceiver('audio');

          let userMediaStream: null | MediaStream = null;
          navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            if (peerConnection.signalingState === 'closed') return;
            userMediaStream = stream;
            stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
            peerConnection.createOffer().then((d) => peerConnection.setLocalDescription(d));
          });
          peerConnection.addEventListener('iceconnectionstatechange', () => {
            logger.info(`voice ${peerConnection.iceConnectionState}`);
            if (
              peerConnection.iceConnectionState === 'disconnected' ||
              peerConnection.iceConnectionState === 'failed' ||
              peerConnection.iceConnectionState === 'closed'
            ) {
              this.setState({ joined: false });
            }
          });
          peerConnection.addEventListener('track', (event) => {
            this.#audioEle.srcObject = event.streams[0];
            this.#audioEle.play().catch(() => {
              this.setState({ joined: false });
            });
          });

          peerConnection.addEventListener('icecandidate', (event) => {
            // why?
            if (event.candidate === null) {
              sendSDP(peerConnection.localDescription!, false).catch(() => {
                this.setState({ joined: false });
              });
            }
          });

          const setSdp = async ({ detail }: CustomEvent<SDPEvent>) => {
            if (roomId !== detail.roomId) return;
            const sdp = new RTCSessionDescription(detail.sdp);
            await peerConnection.setRemoteDescription(sdp);
            if (sdp.type === 'offer') {
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              sendSDP(peerConnection.localDescription!, true).catch(() => {
                this.setState({ joined: false });
              });
            }
          };
          window.addEventListener(events.SDP, setSdp);
          const timer = setInterval(async () => {
            if (peerConnection.iceConnectionState === 'connected') {
              peerConnection
                .getReceivers()
                .map((rv) => rv.track)
                .filter((track) => track.id.length < 20)
                .map(async (track) => {
                  const stats = [...(await peerConnection.getStats(track))];
                  // https://www.w3.org/TR/webrtc-stats/#dom-rtcinboundrtpstreamstats
                  const inboundRtp = stats.find(([_, stat]) => stat.type === 'inbound-rtp')?.[1];
                  updateStore(voiceStore, {
                    audioLevel: { ...voiceStore.audioLevel, [track.id]: inboundRtp.audioLevel || 0 },
                  });
                });
            }
          }, 60);
          return () => {
            clearInterval(timer);
            this.#audioEle.pause();
            userMediaStream?.getTracks().forEach((track) => track.stop());
            window.removeEventListener(events.SDP, setSdp);
            peerConnection.close();
          };
        }
      },
      () => [configure.user?.playing?.id, this.state.joined],
    );
  };

  render = () => {
    return html`
      <dy-use
        class="icon"
        @click=${this.#toggleVoice}
        .element=${this.state.joined ? icons.mic : icons.micOff}
      ></dy-use>
    `;
  };
}
