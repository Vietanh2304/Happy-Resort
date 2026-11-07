// Gọi nhau suốt lúc chơi, giống cuộc gọi meeting: nút Mic và nút Cam bật/tắt riêng.
// Một kết nối WebRTC riêng cho cả buổi (xem callLink.ts); hình và tiếng đi thẳng giữa hai máy.
import { useEffect, useRef, useState } from 'react';
import type { Profile } from './api';
import { CallLink, type CallState } from './callLink';
import { toast } from './toast';

export function useCall(me: Profile, partner: Profile | null) {
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [remoteState, setRemoteState] = useState<CallState>({ mic: false, cam: false });
  const [net, setNet] = useState<RTCPeerConnectionState>('new');
  const link = useRef<CallLink | null>(null);
  const micTrack = useRef<MediaStreamTrack | null>(null);
  const camTrack = useRef<MediaStreamTrack | null>(null);

  const current = () => {
    const tracks = [micTrack.current, camTrack.current].filter((t): t is MediaStreamTrack => !!t);
    return tracks.length ? new MediaStream(tracks) : null;
  };
  /** Gửi bộ hình/tiếng hiện tại cho người ấy */
  function push() {
    const s = current();
    setLocal(s);
    setMic(!!micTrack.current);
    setCam(!!camTrack.current);
    link.current?.setTrack('audio', micTrack.current);
    link.current?.setTrack('video', camTrack.current);
  }

  useEffect(() => {
    if (!partner) return;
    const l = new CallLink(me.id > partner.id, (stream, st, n) => { setRemote(stream); setRemoteState(st); setNet(n); });
    link.current = l;
    l.setTrack('audio', micTrack.current);
    l.setTrack('video', camTrack.current);
    return () => { l.close(); link.current = null; setRemote(null); setRemoteState({ mic: false, cam: false }); };
  }, [me.id, partner?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rời game: tắt hết thiết bị
  useEffect(() => () => { micTrack.current?.stop(); camTrack.current?.stop(); }, []);

  async function grab(kind: 'audio' | 'video') {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast('Trình duyệt chặn mic/cam vì trang không chạy qua https (hoặc localhost)');
      return null;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia(kind === 'audio'
        ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
        : { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } });
      return kind === 'audio' ? s.getAudioTracks()[0] : s.getVideoTracks()[0];
    } catch {
      toast(kind === 'audio' ? '🎙️ Chưa bật được mic: cần cho phép trình duyệt dùng micro' : '📷 Chưa bật được camera: cần cho phép trình duyệt dùng camera');
      return null;
    }
  }

  async function toggle(kind: 'audio' | 'video') {
    const ref = kind === 'audio' ? micTrack : camTrack;
    if (ref.current) {
      ref.current.stop();
      ref.current = null;
      return push();
    }
    const t = await grab(kind);
    if (!t) return;
    ref.current = t;
    t.onended = () => { if (ref.current === t) { ref.current = null; push(); } };
    push();
    if (!partner) toast(kind === 'audio' ? '🎙️ Mic đã bật — khi người ấy vào resort sẽ nghe được bạn' : '📷 Cam đã bật — khi người ấy vào resort sẽ thấy bạn');
  }

  const live = (t: MediaStreamTrack) => t.readyState === 'live';
  // Đường hình/tiếng luôn mở sẵn; người ấy có đang bật cam/mic hay không thì họ báo qua call-state
  const remoteVideo = !!remote && remoteState.cam && remote.getVideoTracks().some(live);
  const partnerTalking = !!remote && remoteState.mic && remote.getAudioTracks().some(live);
  return {
    mic, cam, local, remote, remoteVideo, partnerTalking, net,
    toggleMic: () => toggle('audio'),
    toggleCam: () => toggle('video'),
    hangUp: () => { micTrack.current?.stop(); camTrack.current?.stop(); micTrack.current = camTrack.current = null; push(); },
  };
}
export type Call = ReturnType<typeof useCall>;
