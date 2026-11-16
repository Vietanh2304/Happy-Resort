// Báo nhỏ khi cuộc gọi / chia sẻ màn hình đang đi vòng qua máy chủ chuyển tiếp (tốn dung lượng gói TURN, hình hơi kém nét hơn)
import { useEffect, useState } from 'react';
import { onRelay, relayNow } from '../lib/relay';

export function RelayBadge() {
  const [on, setOn] = useState(relayNow());
  useEffect(() => onRelay(setOn), []);
  if (!on) return null;
  return <span className="relay-badge" title="Mạng đang chặn kết nối thẳng giữa hai máy, nên hình & tiếng đi vòng qua máy chủ chuyển tiếp (tự giảm độ nét để tiết kiệm dung lượng)">📡 đi vòng qua máy chủ</span>;
}
