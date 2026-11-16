// Theo dõi kết nối có phải đi vòng qua máy chủ TURN không (mạng chặn nối thẳng).
// Đi vòng thì tốn dung lượng gói TURN → tự hạ độ nét hình gửi đi, và báo nhỏ trên thanh trên cùng.
type Fn = (relay: boolean) => void;
const via = new Map<string, boolean>(), subs = new Set<Fn>();
export const relayNow = () => [...via.values()].some(Boolean);
export const onRelay = (f: Fn) => { subs.add(f); return () => { subs.delete(f); }; };
const emit = () => { const r = relayNow(); subs.forEach(f => f(r)); };

/** Gọi khi kết nối vừa nối xong / đổi đường: xem cặp địa chỉ đang dùng có phải 'relay' không, rồi chỉnh độ nét */
export async function checkRelay(key: string, pc: RTCPeerConnection) {
  try {
    const st = await pc.getStats();
    let pair: RTCIceCandidatePairStats | undefined;
    st.forEach(r => { if (r.type === 'transport' && (r as RTCTransportStats).selectedCandidatePairId) pair = st.get((r as RTCTransportStats).selectedCandidatePairId!) as RTCIceCandidatePairStats; });
    if (!pair) st.forEach(r => { if (r.type === 'candidate-pair' && (r as RTCIceCandidatePairStats).nominated && (r as RTCIceCandidatePairStats).state === 'succeeded') pair = r as RTCIceCandidatePairStats; });
    if (!pair) return;
    const loc = st.get(pair.localCandidateId) as { candidateType?: string } | undefined, rem = st.get(pair.remoteCandidateId) as { candidateType?: string } | undefined;
    const relay = loc?.candidateType === 'relay' || rem?.candidateType === 'relay';
    if (via.get(key) !== relay) { via.set(key, relay); emit(); }
    const cap = videoCaps(key, relay);
    for (const tr of pc.getTransceivers()) {
      const s = tr.sender;
      if ((s.track?.kind ?? tr.receiver.track.kind) !== 'video') continue;
      const p = s.getParameters(); if (!p.encodings?.length) continue;
      p.encodings[0].maxBitrate = cap.bps; p.encodings[0].maxFramerate = cap.fps;
      await s.setParameters(p).catch(() => {});
    }
  } catch { /* trình duyệt không cho đọc thống kê: bỏ qua */ }
}
/** Giới hạn hình gửi đi: chiếu phim (room:…) ưu tiên nét — đi vòng 1,8 Mbps/24 khung, đi thẳng 3 Mbps/30 khung;
 *  gọi video đi vòng 700 kbps (mặt người không cần nét như phim), đi thẳng 1,5 Mbps */
export const videoCaps = (key: string, relay: boolean) => key.startsWith('room:') ? (relay ? { bps: 1_800_000, fps: 24 } : { bps: 3_000_000, fps: 30 }) : (relay ? { bps: 700_000, fps: 20 } : { bps: 1_500_000, fps: 24 });
export const relayOf = (key: string) => !!via.get(key);
export function dropRelay(key: string) { if (via.delete(key)) emit(); }
