// Cuộc gọi mic + cam suốt lúc chơi, một kết nối WebRTC duy nhất cho cả buổi.
//
// Vì sao không làm lại kết nối mỗi lần bật/tắt: hai người cùng bật mic gần như cùng lúc thì hai máy cùng
// phá kết nối của nhau, tin bắt tay cũ lạc sang kết nối mới → mất cả hình lẫn tiếng.
// Ở đây: mở sẵn hai đường (tiếng, hình) ngay từ đầu; bật/tắt chỉ là thay track trên đường đó (replaceTrack),
// không cần thương lượng lại. Mỗi kết nối có mã phiên (sid); tin bắt tay không đúng phiên thì bỏ qua.
import { onEvent, sendEvent } from './realtime';
import { ICE } from './rtc';

const rid = () => Math.random().toString(36).slice(2, 10);
export interface CallState { mic: boolean; cam: boolean }
type Kind = 'audio' | 'video';

export class CallLink {
  private pc!: RTCPeerConnection;
  private sid = '';
  private peer: string | null = null;
  private paired = false;
  private tx: Record<Kind, RTCRtpTransceiver> | null = null;
  private tracks: Record<Kind, MediaStreamTrack | null> = { audio: null, video: null };
  private makingOffer = false;
  private ignoreOffer = false;
  private remote: MediaStream | null = null;
  private remoteState: CallState = { mic: false, cam: false };
  private off: (() => void)[] = [];
  private iceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private polite: boolean, private onRemote: (stream: MediaStream | null, state: CallState, net: RTCPeerConnectionState) => void) {
    this.off.push(onEvent('call-hello', d => this.hello(d)));
    this.off.push(onEvent('call-sig', d => void this.signal(d)));
    this.off.push(onEvent('call-state', d => { if (d.from === this.peer) { this.remoteState = { mic: !!d.mic, cam: !!d.cam }; this.emit(); } }));
    this.fresh();
    this.sayHello(false);
    if (import.meta.env.DEV) (window as unknown as { __call: CallLink }).__call = this;
  }

  private state(): CallState { return { mic: !!this.tracks.audio, cam: !!this.tracks.video }; }
  private emit() { this.onRemote(this.remote, this.remoteState, this.pc?.connectionState ?? 'new'); }
  private sayHello(reply: boolean) { sendEvent('call-hello', { sid: this.sid, reply, ...this.state() }); }
  private send(data: object) { if (this.peer) sendEvent('call-sig', { from: this.sid, to: this.peer, ...data }); }

  /** Kết nối mới tinh (mã phiên mới), giữ nguyên mic/cam đang bật */
  private fresh() {
    this.pc?.close();
    clearTimeout(this.iceTimer);
    this.sid = rid();
    this.paired = false;
    this.makingOffer = this.ignoreOffer = false;
    const pc = new RTCPeerConnection({ iceServers: ICE });
    this.pc = pc;
    this.tx = null;
    this.remote = null;
    // Chỉ bên mở lời tạo sẵn hai đường. Bên kia dùng đúng các đường mà lời mời tạo ra
    // (trình duyệt không ghép đường tự tạo bằng addTransceiver với lời mời của người khác).
    if (!this.polite) {
      const local = new MediaStream();
      this.adopt({
        audio: pc.addTransceiver('audio', { direction: 'sendrecv', streams: [local] }),
        video: pc.addTransceiver('video', { direction: 'sendrecv', streams: [local] }),
      });
    }
    this.remoteState = { mic: false, cam: false };
    this.emit();
    pc.onicecandidate = e => e.candidate && this.send({ candidate: e.candidate.toJSON() });
    pc.onnegotiationneeded = () => { if (this.paired) void this.negotiate(); };
    pc.onconnectionstatechange = () => {
      clearTimeout(this.iceTimer);
      this.emit();
      // Mạng chập chờn: thử nối lại đường truyền (không phải làm lại cả cuộc gọi)
      if (pc.connectionState === 'failed') pc.restartIce();
      else if (pc.connectionState === 'disconnected') this.iceTimer = setTimeout(() => pc.connectionState === 'disconnected' && pc.restartIce(), 4000);
    };
  }

  /** Gắn mic/cam đang bật vào hai đường, và lấy luồng hình/tiếng của người ấy từ đó */
  private adopt(tx: Record<Kind, RTCRtpTransceiver>) {
    this.tx = tx;
    for (const k of ['audio', 'video'] as Kind[]) { tx[k].direction = 'sendrecv'; void tx[k].sender.replaceTrack(this.tracks[k]); }
    this.remote = new MediaStream([tx.audio.receiver.track, tx.video.receiver.track]);
    this.emit();
  }

  private async negotiate() {
    try {
      this.makingOffer = true;
      await this.pc.setLocalDescription();
      this.send({ description: this.pc.localDescription });
    } catch (e) {
      console.warn('call offer', e);
    } finally {
      this.makingOffer = false;
    }
  }

  /** Người ấy chào (vừa vào game / tải lại trang) hoặc chào đáp lại */
  private hello(d: { sid: string; reply?: boolean; mic?: boolean; cam?: boolean }) {
    if (!d.sid || d.sid === this.sid) return;
    if (d.sid !== this.peer) {
      // Lời đáp của một phiên cũ: bỏ qua. Chỉ lời chào mở đầu mới được làm lại kết nối
      // (nếu lời đáp cũng làm lại thì hai máy sẽ thay nhau làm lại mãi).
      if (d.reply && this.paired) return;
      if (this.paired) this.fresh();       // bên kia là phiên mới (tải lại trang): làm kết nối mới
      this.peer = d.sid;
      this.paired = true;
      if (!d.reply) this.sayHello(true);
      if (!this.polite) void this.negotiate();   // một bên cố định mở lời, tránh hai offer va nhau
    } else if (!d.reply) {
      this.sayHello(true);                 // họ chưa nhận được lời chào của mình
    }
    this.remoteState = { mic: !!d.mic, cam: !!d.cam };
    this.emit();
  }

  private async signal({ from, to, description, candidate }: { from: string; to: string; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    if (to !== this.sid || from !== this.peer) return;   // tin của kết nối cũ
    const pc = this.pc;
    try {
      if (description) {
        const collision = description.type === 'offer' && (this.makingOffer || pc.signalingState !== 'stable');
        this.ignoreOffer = !this.polite && collision;
        if (this.ignoreOffer) return;
        await pc.setRemoteDescription(description);
        if (description.type === 'offer' && !this.tx) {
          const ts = pc.getTransceivers();
          const pick = (k: Kind) => ts.find(t => t.receiver.track.kind === k);
          const audio = pick('audio'), video = pick('video');
          if (audio && video) this.adopt({ audio, video });
        }
        if (description.type === 'offer') {
          await pc.setLocalDescription();
          this.send({ description: pc.localDescription });
        }
      } else if (candidate) {
        await pc.addIceCandidate(candidate).catch(e => { if (!this.ignoreOffer) console.warn('call ice', e); });
      }
    } catch (e) {
      console.warn('call signal', e);
    }
  }

  /** Bật/tắt mic hoặc cam: chỉ thay track, không làm lại kết nối */
  setTrack(kind: Kind, track: MediaStreamTrack | null) {
    if (this.tracks[kind] === track) return;
    this.tracks[kind] = track;
    if (this.tx) void this.tx[kind].sender.replaceTrack(track);   // chưa có đường thì gắn lúc nhận lời mời
    sendEvent('call-state', { from: this.sid, ...this.state() }, 'call-state');
  }

  close() {
    clearTimeout(this.iceTimer);
    this.off.forEach(f => f());
    this.pc.close();
  }
}
