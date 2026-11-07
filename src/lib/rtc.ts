// Gọi video / chia sẻ màn hình trực tiếp giữa hai máy (WebRTC).
// Tín hiệu bắt tay đi qua kênh realtime của cặp đôi; hình và tiếng đi thẳng giữa hai máy.
// Dùng mẫu "perfect negotiation": bên nào thêm hình/tiếng thì bên đó gửi offer, va chạm thì bên "polite" nhường.
import { onEvent, sendEvent } from './realtime';

// STUN (miễn phí) đủ cho phần lớn mạng nhà. Mạng 4G/công ty chặn kết nối thẳng thì cần TURN chuyển tiếp:
// điền VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL trong .env (nhiều URL cách nhau dấu phẩy).
const env = import.meta.env;
const TURN = (env.VITE_TURN_URL as string | undefined)?.split(',').map(u => u.trim()).filter(Boolean) ?? [];
export const ICE: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
  ...(TURN.length ? [{ urls: TURN, username: (env.VITE_TURN_USERNAME as string)?.trim(), credential: (env.VITE_TURN_CREDENTIAL as string)?.trim() }] : []),
];

export class RtcRoom {
  private pc!: RTCPeerConnection;
  private local: MediaStream | null = null;
  private makingOffer = false;
  private ignoreOffer = false;
  private off: (() => void)[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private wantHello = false;
  private wantReply = false;
  /** Tin bắt tay xử lý lần lượt; địa chỉ tới trước lời mời thì giữ lại, nạp sau */
  private queue: Promise<void> = Promise.resolve();
  private early: RTCIceCandidateInit[] = [];

  constructor(
    private room: string,
    private polite: boolean,
    private onRemote: (stream: MediaStream | null) => void,
    private onLocal: (stream: MediaStream | null) => void,
  ) {
    this.off.push(onEvent('rtc', d => { if (d.room === room) this.queue = this.queue.then(() => this.signal(d)); }));
    // Ai vào phòng sau thì chào; cả hai cùng làm lại kết nối để bên đang có hình gửi lại
    this.off.push(onEvent('rtc-hello', d => {
      if (d.room !== room) return;
      this.later(false, !d.reply);
    }));
    this.reset();
    sendEvent('rtc-hello', { room });
  }

  /**
   * Làm lại kết nối sau một nhịp ngắn: bật mic rồi bật cam liền tay (hay hai bên cùng chào)
   * chỉ làm lại một lần, tránh hai bên lệch nhau rồi mất hình.
   */
  private later(hello: boolean, reply: boolean) {
    this.wantHello ||= hello;
    this.wantReply ||= reply;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.reset();
      if (this.wantHello) sendEvent('rtc-hello', { room: this.room });
      else if (this.wantReply) sendEvent('rtc-hello', { room: this.room, reply: true });
      this.wantHello = this.wantReply = false;
    }, 250);
  }

  private send(data: object) {
    sendEvent('rtc', { room: this.room, ...data });
  }

  private reset() {
    this.pc?.close();
    this.early = [];
    const pc = new RTCPeerConnection({ iceServers: ICE });
    this.pc = pc;
    this.onRemote(null);
    pc.onicecandidate = e => e.candidate && this.send({ candidate: e.candidate.toJSON() });
    // Mỗi lần có thêm hình/tiếng: tạo luồng mới để giao diện vẽ lại (mic rồi mới bật cam...)
    pc.ontrack = e => this.onRemote(new MediaStream(e.streams[0]?.getTracks() ?? [e.track]));
    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await pc.setLocalDescription();
        this.send({ description: pc.localDescription });
      } catch (e) {
        console.warn('rtc offer', e);
      } finally {
        this.makingOffer = false;
      }
    };
    this.local?.getTracks().forEach(t => pc.addTrack(t, this.local!));
  }

  private async signal({ description, candidate }: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    const pc = this.pc;
    try {
      if (description) {
        const collision = description.type === 'offer' && (this.makingOffer || pc.signalingState !== 'stable');
        this.ignoreOffer = !this.polite && collision;
        if (this.ignoreOffer) return;
        await pc.setRemoteDescription(description);
        for (const c of this.early.splice(0)) await pc.addIceCandidate(c).catch(e => console.warn('rtc ice (early)', e));
        if (description.type === 'offer') {
          await pc.setLocalDescription();
          this.send({ description: pc.localDescription });
        }
      } else if (candidate) {
        if (!pc.remoteDescription) { this.early.push(candidate); return; }
        await pc.addIceCandidate(candidate).catch(e => { if (!this.ignoreOffer) console.warn('rtc ice', e); });
      }
    } catch (e) {
      console.warn('rtc signal', e);
    }
  }

  /** Bắt đầu gửi một luồng (màn hình hoặc camera) cho người ấy */
  start(stream: MediaStream) {
    this.stopLocal(false);
    this.local = stream;
    this.onLocal(stream);
    stream.getTracks().forEach(t => {
      this.pc.addTrack(t, stream);
      t.onended = () => this.stop(); // bấm "Dừng chia sẻ" của trình duyệt
    });
  }

  /** Ngừng gửi; cả hai làm lại kết nối để màn hình bên kia tắt */
  stop() {
    if (!this.local) return;
    this.stopLocal(true);
    this.later(true, false);
  }

  /** Đổi bộ hình/tiếng đang gửi (bật/tắt riêng mic, cam). Không tắt track — bên gọi tự quản lý. */
  update(stream: MediaStream | null) {
    this.local = stream && stream.getTracks().length ? stream : null;
    this.onLocal(this.local);
    this.later(true, false);
  }

  get sending() {
    return !!this.local;
  }

  private stopLocal(clear: boolean) {
    this.local?.getTracks().forEach(t => { t.onended = null; t.stop(); });
    this.local = null;
    if (clear) this.onLocal(null);
  }

  close() {
    clearTimeout(this.timer);
    this.off.forEach(f => f());
    this.stopLocal(true);
    this.pc.close();
  }
}
