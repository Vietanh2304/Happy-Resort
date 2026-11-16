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
    // đi vòng: còn ~600 kbps, khung 15 — tiết kiệm khoảng một nửa dung lượng; nối thẳng: trả lại độ nét cao
    for (const tr of pc.getTransceivers()) {
      const s = tr.sender;
      if ((s.track?.kind ?? tr.receiver.track.kind) !== 'video') continue;
      const p = s.getParameters(); if (!p.encodings?.length) continue;
      p.encodings[0].maxBitrate = relay ? 600_000 : 1_200_000; p.encodings[0].maxFramerate = relay ? 15 : 20;
      await s.setParameters(p).catch(() => {});
    }
  } catch { /* trình duyệt không cho đọc thống kê: bỏ qua */ }
}
export function dropRelay(key: string) { if (via.delete(key)) emit(); }
