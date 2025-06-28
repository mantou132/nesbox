import { connectStore, createState, createStore, customElement, effect, GemElement, html } from '@mantou/gem';
import { isMtApp } from '@nesbox/mtapp';
import { configure } from 'src/configure';
import { globalEvents, type VoiceSignalDetail } from 'src/constants';
import { ScVoiceMsgKind } from 'src/generated/graphql';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { logger } from 'src/logger';
import { sendVoiceMsg } from 'src/services/api';

import 'duoyun-ui/elements/use';
import 'src/elements/tooltip';

export const voiceStore = createStore<{ audioLevel: Record<number, number> }>({
  audioLevel: {},
});

@customElement('m-room-voice')
@connectStore(configure)
export class MVoiceRoomElement extends GemElement {
  #state = createState({
    joined: false,
    receiverTracks: [] as { trackId: string; userId: number }[],
  });

  toggleVoice = () => {
    this.#state({ joined: !this.#state.joined });
  };

  #closeVoice = () => this.#state({ joined: false });

  #audioEle = document.createElement('audio');

  @effect((i) => [configure.user?.playing?.id, i.#state.joined])
  #reset = () => {
    const roomId = configure.user?.playing?.id;
    if (roomId && this.#state.joined) {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun3.l.google.com:19302' }],
      });
      logger.info('RTCPeerConnection', peerConnection);

      let userMediaStream: null | MediaStream = null;
      // https://github.com/tauri-apps/tauri/issues/5039
      navigator.mediaDevices?.getUserMedia({ audio: { channelCount: 1, sampleRate: 11025 } }).then(async (stream) => {
        userMediaStream = stream;
        if (peerConnection.signalingState === 'closed') return;
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
        sendVoiceMsg(ScVoiceMsgKind.Offer, peerConnection.localDescription!).catch(this.#closeVoice);
      });

      peerConnection.addEventListener('iceconnectionstatechange', () => {
        logger.info(`voice iceConnectionState ${peerConnection.iceConnectionState}`);
        if (
          peerConnection.iceConnectionState === 'disconnected' ||
          peerConnection.iceConnectionState === 'failed' ||
          peerConnection.iceConnectionState === 'closed'
        ) {
          this.#closeVoice();
        }
      });

      peerConnection.addEventListener('track', ({ streams }) => {
        logger.info(
          `voice track`,
          streams.flatMap((s) => s.getTracks()),
        );
        this.#audioEle.srcObject = streams[0];
        this.#audioEle.play().catch(this.#closeVoice);
        peerConnection.getReceivers().map(({ track }, i) => {
          const receiverTrack = this.#state.receiverTracks[i];
          if (receiverTrack) receiverTrack.trackId = track.id;
        });
        streams[0].onremovetrack = ({ track }) => {
          const userId = this.#state.receiverTracks.find((e) => e.trackId === track.id)?.userId;
          voiceStore({ audioLevel: { ...voiceStore.audioLevel, [String(userId)]: undefined } });
        };
      });

      peerConnection.addEventListener('icecandidate', ({ candidate }) => {
        candidate &&
          sendVoiceMsg(ScVoiceMsgKind.Ice, candidate).catch(() => {
            //
          });
      });

      peerConnection.addEventListener('icecandidateerror', (event) => {
        logger.error(event);
      });

      const handleVoiceMsg = async ({ detail }: CustomEvent<VoiceSignalDetail>) => {
        if (roomId !== detail.roomId) return;
        if ('candidate' in detail.signal) {
          peerConnection.addIceCandidate(new RTCIceCandidate(detail.signal)).catch(logger.error);
        }
        if ('type' in detail.signal) {
          this.#state({
            // trackId init in `ontrack`
            receiverTracks: detail.signal.senderTrackIds.map((userId) => ({ trackId: '', userId: Number(userId) })),
          });
          const sdp = new RTCSessionDescription(detail.signal);
          await peerConnection.setRemoteDescription(sdp);
          if (sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            sendVoiceMsg(ScVoiceMsgKind.Answer, peerConnection.localDescription!).catch(this.#closeVoice);
          }
        }
      };

      addEventListener(globalEvents.VOICE_SIGNAL, handleVoiceMsg);

      const intervalTimer = setInterval(async () => {
        if (peerConnection.iceConnectionState !== 'connected') return;
        peerConnection.getReceivers().map(async ({ track }, i) => {
          const stats = [...(await peerConnection.getStats(track))];
          // https://www.w3.org/TR/webrtc-stats/#dom-rtcinboundrtpstreamstats
          const inboundRtp = stats.find(([_, stat]) => stat.type === 'inbound-rtp')?.[1];
          const userId = this.#state.receiverTracks[i]?.userId;
          if (inboundRtp) {
            voiceStore({
              audioLevel: { ...voiceStore.audioLevel, [userId]: inboundRtp.audioLevel || 0 },
            });
          }
        });
        peerConnection.getSenders().map(async ({ track }) => {
          const stats = [...(await peerConnection.getStats(track))];
          const mediaSource = stats.find(([_, stat]) => stat.type === 'media-source')?.[1];
          if (mediaSource) {
            // Safari not support
            voiceStore({
              audioLevel: { ...voiceStore.audioLevel, [configure.user!.id]: mediaSource.audioLevel || 0 },
            });
          }
        });
      }, 60);

      return () => {
        voiceStore({ audioLevel: {} });
        clearInterval(intervalTimer);
        this.#audioEle.pause();
        userMediaStream?.getTracks().forEach((track) => track.stop());
        removeEventListener(globalEvents.VOICE_SIGNAL, handleVoiceMsg);
        peerConnection.close();
      };
    }
  };

  render = () => {
    const { joined } = this.#state;
    return html`
      <nesbox-tooltip
        .content=${joined ? i18n.get('tooltip.room.stopVoice') : i18n.get('tooltip.room.startVoice')}
        position=${isMtApp ? 'bottomRight' : 'topRight'}
      >
        <dy-use class="icon" @click=${this.toggleVoice} .element=${joined ? icons.mic : icons.micOff}></dy-use>
      </nesbox-tooltip>
    `;
  };
}
