// Đi làm ở công ty: mỗi ngày làm việc (thứ 2–6) có 3 việc; xong hết thì tan làm, nhận lương (hũ xu chung) và
// "đưa lương cho người ấy". Cứ 4–5 ngày có một drama công sở rẽ nhánh theo lựa chọn (sếp có bồ, bị đuổi, lên leader,
// đồng nghiệp theo đuổi, bị nói xấu…), xen kẽ drama vặt ngẫu nhiên. Mỗi drama có thể kể lại cho người ấy nghe.
import { seeded } from './rng';

export type Role = 'staff' | 'leader' | 'manager';
export interface DramaLog { day: string; title: string; text: string }
export interface JobData {
  company: number;            // đang làm ở công ty nào (COMPANIES)
  role: Role;
  since: string;              // ngày vào công ty hiện tại
  days: number;               // tổng số ngày đã đi làm
  favor: number;              // sếp quý (-10..10)
  mates: number;              // quan hệ đồng nghiệp (-10..10)
  rumor: number;              // tiếng xấu (0..10)
  today?: { day: string; done: Record<string, number> };   // việc đã làm hôm nay (id → số câu đúng)
  drama?: { id: string; day: string; picked?: number; text?: string } | null;
  next?: string | null;       // drama nối tiếp (bước sau của một mạch truyện)
  nextDay: string;            // ngày sẽ có drama tiếp theo
  flags: string[];
  log: DramaLog[];
}

export const COMPANIES = [
  { name: 'Công ty Hy Tech', icon: '🏢', boss: 'sếp Tùng', bossWife: 'chị Hằng', pay: 1 },
  { name: 'Công ty Mây Xanh', icon: '☁️', boss: 'sếp Quang', bossWife: 'chị Ngọc', pay: 1.1 },
  { name: 'Studio Đậu Đỏ', icon: '🫘', boss: 'chị Thảo', bossWife: 'anh Phong', pay: 1.2 },
  { name: 'Tập đoàn Sóng Biển', icon: '🌊', boss: 'sếp Hùng', bossWife: 'chị Lan', pay: 1.35 },
];
export const ROLE_NAME: Record<Role, string> = { staff: 'Nhân viên', leader: 'Trưởng nhóm (leader)', manager: 'Trưởng phòng' };
const BASE_PAY: Record<Role, number> = { staff: 300, leader: 480, manager: 720 };

export function newJob(date: string): JobData {
  return { company: 0, role: 'staff', since: date, days: 0, favor: 0, mates: 0, rumor: 0, today: { day: date, done: {} }, drama: null, next: null, nextDay: addDays(date, 2), flags: [], log: [] };
}
export const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const workday = (date: string) => { const w = new Date(`${date}T12:00:00`).getDay(); return w >= 1 && w <= 5; };
const clamp = (v: number, a = -10, b = 10) => Math.max(a, Math.min(b, v));

// ───────── Việc hằng ngày ─────────
export interface TaskStep { q: string; options: string[]; ok: number }
export interface Task { id: string; icon: string; title: string; desc: string; steps: TaskStep[]; favor?: number }

const DOCS: [string, number][] = [['Hóa đơn tiền điện tháng 10', 0], ['Hợp đồng thuê văn phòng', 1], ['Báo cáo doanh thu quý', 2], ['Hóa đơn mua máy in', 0], ['Hợp đồng lao động bạn mới', 1], ['Báo cáo khảo sát khách hàng', 2], ['Hóa đơn tiệc công ty', 0], ['Hợp đồng với đối tác Nhật', 1], ['Báo cáo tiến độ dự án', 2]];
const EMAILS: [string, string[], number][] = [
  ['Khách hàng: "Bao giờ có hàng ạ?"', ['Dạ, hàng sẽ tới vào thứ Sáu này, em gửi mã vận đơn kèm theo ạ.', 'Không biết.', 'Hỏi bên kho đi.'], 0],
  ['Sếp: "Báo cáo đâu rồi?"', ['Mai em gửi.', 'Dạ em gửi ngay trong 30 phút nữa, có tóm tắt 3 ý chính ạ.', 'Em quên mất.'], 1],
  ['Đối tác: "Có thể giảm giá 5%?"', ['Được luôn, giảm 50% cũng được!', 'Không.', 'Dạ em xin phép trao đổi với quản lý và phản hồi trong hôm nay ạ.'], 2],
  ['Đồng nghiệp: "Mượn sạc laptop xíu"', ['Ok, bàn mình ngăn thứ 2 nha 😊', 'Tự mua đi.', '(Không trả lời)'], 0],
  ['Phòng nhân sự: "Xác nhận lịch nghỉ phép"', ['Lịch nào cũng được.', 'Dạ em xác nhận nghỉ thứ Hai tuần sau, đã bàn giao việc cho anh Minh ạ.', 'Sao hỏi hoài vậy?'], 1],
  ['Khách hàng: "Sản phẩm bị lỗi!"', ['Lỗi do bạn dùng sai.', 'Dạ em rất tiếc, em xin hình ảnh lỗi để đổi mới cho mình ngay ạ.', 'Mai tính.'], 1],
];
const MEETINGS: [string, string[], number, number][] = [
  ['Sếp hỏi ý tưởng tăng doanh số', ['Chạy khuyến mãi mua 1 tặng 1 cuối tuần', 'Ngủ trong cuộc họp', 'Tăng giá gấp đôi'], 0, 2],
  ['Họp về lịch nghỉ Tết', ['Đề xuất chia ca trực luân phiên', 'Nghỉ hết cả tháng', 'Im lặng'], 0, 1],
  ['Dự án trễ hạn, sếp hỏi lý do', ['Đổ lỗi cho đồng nghiệp', 'Nhận trách nhiệm, đưa ra kế hoạch bù tiến độ', 'Bảo do trời mưa'], 1, 2],
  ['Chọn chỗ đi team building', ['Biển Nha Trang — cả nhóm cùng bỏ phiếu', 'Ở văn phòng họp tiếp', 'Đi đâu cũng được, miễn không phải mình lo'], 0, 1],
];

/** 3 việc của hôm nay (cố định theo ngày + người) */
export function tasksOf(userId: string, date: string): Task[] {
  const r = seeded(`work:${userId}:${date}`);
  const pick = <T,>(a: T[], n: number) => [...a].sort(() => r() - 0.5).slice(0, n);
  const docs = pick(DOCS, 4);
  const mails = pick(EMAILS, 3);
  const a = 3 + Math.floor(r() * 9), b = 12 + Math.floor(r() * 30), c = 5 + Math.floor(r() * 20);
  const sum = (a + b + c) * 1000;
  const opts = [sum, sum + 1000, sum - 1000].sort(() => r() - 0.5);
  const meet = pick(MEETINGS, 1)[0];
  const pool: Task[] = [
    { id: 'paper', icon: '📄', title: 'Xử lý giấy tờ', desc: 'Xếp từng giấy tờ vào đúng khay.', steps: docs.map(([d, k]) => ({ q: d, options: ['🧾 Khay hóa đơn', '📑 Khay hợp đồng', '📊 Khay báo cáo'], ok: k })) },
    { id: 'mail', icon: '📧', title: 'Trả lời email', desc: 'Chọn câu trả lời chuyên nghiệp nhất.', steps: mails.map(([q, o, k]) => ({ q, options: o, ok: k })) },
    { id: 'data', icon: '📊', title: 'Nhập số liệu', desc: 'Cộng doanh thu 3 cửa hàng cho đúng.', steps: [{ q: `Cửa hàng A: ${a}.000 · B: ${b}.000 · C: ${c}.000 — tổng là?`, options: opts.map(v => `${(v / 1000).toLocaleString('vi-VN')}.000`), ok: opts.indexOf(sum) }] },
    { id: 'meet', icon: '🗣️', title: 'Họp giao ban', desc: meet[0], steps: [{ q: meet[0], options: meet[1], ok: meet[2] }], favor: meet[3] },
    { id: 'coffee', icon: '☕', title: 'Pha cà phê cho sếp', desc: 'Sếp thích cà phê sữa ít đường.', steps: [{ q: 'Sếp gọi: "Cho anh ly như mọi khi"', options: ['☕ Cà phê sữa ít đường', '🍵 Trà xanh', '🧋 Trà sữa full topping'], ok: 0 }], favor: 1 },
  ];
  // luôn có giấy tờ + email, thêm 1 việc đổi theo ngày
  return [pool[0], pool[1], pick(pool.slice(2), 1)[0]];
}

/** Lương hôm nay: theo chức vụ, công ty, và số câu làm đúng */
export function salaryOf(job: JobData, tasks: Task[]) {
  const done = job.today?.done ?? {};
  const total = tasks.reduce((s, t) => s + t.steps.length, 0);
  const right = tasks.reduce((s, t) => s + (done[t.id] ?? 0), 0);
  const perf = total ? right / total : 0;
  return Math.round(BASE_PAY[job.role] * COMPANIES[job.company].pay * (0.6 + 0.4 * perf) / 10) * 10;
}

// ───────── Drama công sở (kiểu game nhập vai lựa chọn) ─────────
// Mỗi drama có vài lựa chọn; mỗi lựa chọn có thể ra nhiều kết cục (có may rủi), và kết cục có thể mở ra
// một tình huống tiếp theo (`next`) ở lần drama sau. Drama đã gặp thì phải hết vòng mới gặp lại.
export interface Result {
  w?: number;           // trọng số may rủi (mặc định 1)
  t: string;            // chuyện gì xảy ra
  f?: number; m?: number; r?: number;   // sếp quý, đồng nghiệp, tin đồn
  flag?: string; next?: string; role?: Role; fired?: boolean; company?: number;
  bonus?: number;       // thưởng xu (vào hũ chung)
}
export interface Choice { label: string; res: Result[] }
export interface Drama { id: string; title: string; icon: string; text: string; choices: Choice[]; when?: (j: JobData) => boolean; start?: boolean }

/** Tên người trong truyện (đổi theo công ty và giới tính của người chơi) */
export function cast(job: JobData, girl: boolean) {
  const co = COMPANIES[job.company];
  return { boss: co.boss, wife: co.bossWife, co: co.name, crush: girl ? 'anh Khoa (phòng kỹ thuật)' : 'em Vy (phòng marketing)', crushShort: girl ? 'anh Khoa' : 'em Vy', mate: 'anh Minh', mate2: 'chị Hoa', intern: 'bé Bông thực tập', partnerWord: girl ? 'anh ấy' : 'cô ấy' };
}

export function dramas(job: JobData, girl: boolean): Drama[] {
  const c = cast(job, girl);
  return [
    // ════════ Mạch: núi giấy tờ ════════
    { id: 'paperwork', start: true, icon: '📚', title: 'Núi giấy tờ trước hạn chót', when: j => j.days >= 1,
      text: `Chiều thứ Sáu, ${c.boss} thả xuống bàn bạn cả chồng hồ sơ: "Sáng thứ Hai anh cần hết nhé." ${c.mate} nhìn bạn đầy thương cảm.`,
      choices: [
        { label: 'Ở lại tăng ca làm cho xong', res: [
          { w: 3, t: `Bạn về lúc 11 giờ đêm nhưng xong hết. Sáng thứ Hai ${c.boss} gật gù: "Được việc đấy." Cuối tháng có thưởng.`, f: 2, bonus: 150 },
          { w: 1, t: 'Bạn làm xong… và lăn ra cảm sốt. Sáng mai đầu nặng trĩu, người nóng ran.', f: 1, next: 'sick' } ] },
        { label: `Nhờ ${c.mate} chia bớt, mời trà sữa trả công`, res: [
          { w: 2, t: `${c.mate} vui vẻ giúp, hai người xong sớm còn kịp đi ăn lẩu.`, m: 2 },
          { w: 1, t: `${c.mate} giúp nhưng… nhập sai cả bảng số liệu khách hàng. Thứ Hai sếp phát hiện!`, m: 1, next: 'minh_mistake' } ] },
        { label: 'Để thứ Hai tính', res: [
          { w: 1, t: `May quá, ${c.boss} đi công tác đột xuất cả tuần, quên luôn đống hồ sơ. Thoát nạn!` },
          { w: 2, t: `Thứ Hai bạn nộp thiếu một nửa. ${c.boss} nhíu mày, ghi tên bạn vào sổ đen.`, f: -2 } ] },
      ] },
    { id: 'sick', icon: '🤒', title: 'Ốm vì tăng ca',
      text: `Bạn sốt 38,5 độ. ${c.boss} nhắn: "Hôm nay có cuộc họp với khách lớn, em cố lên được không?"`,
      choices: [
        { label: `Xin nghỉ, gọi video cho ${c.partnerWord} chăm từ xa`, res: [
          { w: 2, t: `Cả ngày ${c.partnerWord} gọi video nhắc uống thuốc, kể chuyện cười. Ốm mà vui. Sếp cũng thông cảm.`, f: 0 },
          { w: 1, t: `${c.mate} họp thay và chốt được hợp đồng — được khen hết phần. Hơi tiếc nhưng sức khỏe là trên hết.`, m: 1 } ] },
        { label: 'Uống thuốc rồi gắng đi họp', res: [
          { w: 1, t: 'Bạn thuyết trình xuất sắc dù giọng khàn. Khách ký hợp đồng ngay tại chỗ! Thưởng nóng.', f: 3, bonus: 300 },
          { w: 1, t: 'Giữa buổi họp bạn hắt xì liên tục, khách xin dời lịch. Sếp bảo: "Lần sau ốm thì nghỉ đi em."', f: -1 } ] },
      ] },
    { id: 'minh_mistake', icon: '😱', title: `${c.mate} nhập sai số liệu`,
      text: `${c.boss} phát hiện bảng số liệu sai be bét, hỏi cả phòng: "Ai làm cái này?" ${c.mate} cúi gằm mặt.`,
      choices: [
        { label: 'Nhận phần trách nhiệm chung: "Bọn em làm cùng ạ"', res: [
          { w: 2, t: `${c.boss} chỉ nhắc nhở. ${c.mate} cảm kích, từ nay coi bạn là anh em chí cốt.`, m: 3, f: -1 },
          { w: 1, t: `${c.boss} phạt cả hai viết bản kiểm điểm. ${c.mate} áy náy mời bạn ăn trưa cả tuần.`, m: 2, f: -2 } ] },
        { label: `Nói thật: phần sai là của ${c.mate}`, res: [
          { w: 1, t: `${c.boss} khen bạn trung thực. ${c.mate} giận bạn mấy ngày liền.`, f: 2, m: -2 },
          { w: 1, t: `${c.mate} bị trừ thưởng, cả phòng bàn tán bạn "bán đứng" đồng nghiệp.`, f: 1, m: -3, r: 2 } ] },
        { label: 'Lặng lẽ sửa lại hết rồi nộp bản mới', res: [
          { t: `Bạn thức khuya sửa xong. ${c.boss} không biết chuyện gì, còn ${c.mate} thì nợ bạn một ân tình lớn.`, m: 3 } ] },
      ] },

    // ════════ Mạch: sếp có bồ ════════
    { id: 'affair', start: true, icon: '🕵️', title: 'Sếp có bồ?!', when: j => j.days >= 3 && j.next !== 'newjob',
      text: `Tối qua đi dạo, bạn bắt gặp ${c.boss} khoác tay một cô gái trẻ — không phải ${c.wife}. ${c.boss} quay lại… và nhìn thẳng vào bạn.`,
      choices: [
        { label: 'Giả vờ không thấy, quay đi', res: [
          { w: 2, t: `Sáng nay trên bàn bạn có ly cà phê và hộp bánh: "Cảm ơn em đã hiểu chuyện." — ${c.boss}.`, f: 2, flag: 'affair', next: 'affair_bribe' },
          { w: 1, t: `${c.boss} lo bạn hớt lẻo, bắt đầu soi mói từng lỗi nhỏ của bạn…`, f: -2, flag: 'affair', next: 'affair_cold' } ] },
        { label: 'Lén chụp một tấm ảnh "phòng thân"', res: [
          { t: 'Bạn giữ tấm ảnh trong máy. Nó có thể là con át chủ bài… hoặc quả bom nổ chậm.', flag: 'affair', next: 'affair_photo' } ] },
        { label: 'Bước tới chào: "Ơ sếp, đi với ai đây ạ?"', res: [
          { w: 1, t: `Cô gái đỏ mặt bỏ đi. ${c.boss} gượng cười rồi từ hôm sau lạnh tanh với bạn.`, f: -3, flag: 'affair', next: 'affair_cold' },
          { w: 1, t: `Hóa ra đó là em gái họ của sếp từ quê lên! Cả ba cười xòa, sếp còn mời bạn ăn kem. Hú hồn.`, f: 2, flag: 'affair_false' } ] },
      ] },
    { id: 'affair_bribe', icon: '💵', title: 'Phong bì "im lặng"',
      text: `${c.boss} gọi bạn vào phòng, đẩy ra một phong bì: "Tháng này anh xét tăng lương cho em. Chuyện hôm trước… mình quên đi nhé."`,
      choices: [
        { label: 'Nhận và im lặng', res: [
          { w: 2, t: `Lương tăng thật. Nhưng tuần sau ${c.wife} tới công ty tìm bạn…`, f: 2, bonus: 400, next: 'affair_wife' },
          { w: 1, t: 'Bạn nhận, mọi chuyện êm xuôi. Nhưng mỗi lần thấy sếp, bạn lại thấy khó chịu trong lòng.', f: 3, bonus: 400 } ] },
        { label: 'Trả lại phong bì: "Em không nói đâu, sếp yên tâm"', res: [
          { w: 2, t: `${c.boss} sững người rồi gật đầu nể phục. Từ đó sếp tin tưởng bạn hơn ai hết.`, f: 3 },
          { w: 1, t: `${c.boss} nghĩ bạn "chê ít", càng nghi ngờ bạn hơn…`, f: -1, next: 'affair_cold' } ] },
      ] },
    { id: 'affair_photo', icon: '📸', title: 'Tấm ảnh trong điện thoại',
      text: `Có tin công ty sắp xét thăng chức. Tấm ảnh ${c.boss} và cô gái vẫn nằm trong máy bạn…`,
      choices: [
        { label: 'Dùng ảnh "nói chuyện" với sếp để được thăng chức', res: [
          { w: 1, t: `${c.boss} tái mặt, ký quyết định thăng chức cho bạn. Bạn lên leader… nhưng cả công ty bắt đầu đồn bạn "có ô dù".`, role: 'leader', r: 3, f: -3 },
          { w: 1, t: `${c.boss} bình tĩnh gọi phòng nhân sự: "Nhân viên này đe dọa cấp trên." 💥 Bạn bị đuổi việc ngay hôm đó!`, fired: true, next: 'newjob' } ] },
        { label: `Gửi ảnh ẩn danh cho ${c.wife}`, res: [
          { w: 1, t: `Gia đình sếp lục đục, ${c.boss} bị ban giám đốc điều chuyển sang chi nhánh khác. Sếp mới tới — một người rất công tâm.`, f: 0, flag: 'new_boss' },
          { w: 1, t: `${c.wife} làm ầm lên ở công ty, rồi lần ra ai gửi ảnh. Bạn bị coi là kẻ phá hoại, đành nộp đơn nghỉ việc.`, fired: true, next: 'newjob' } ] },
        { label: 'Xóa ảnh, coi như chưa từng thấy', res: [
          { t: 'Bạn xóa ảnh, nhẹ cả lòng. Chuyện người lớn để người lớn tự giải quyết.', m: 1 } ] },
      ] },
    { id: 'affair_cold', icon: '🥶', title: 'Bị sếp "trù"',
      text: `Dạo này ${c.boss} giao cho bạn toàn việc khó, họp nào cũng hỏi vặn bạn trước cả phòng.`,
      choices: [
        { label: 'Nhẫn nhịn, làm thật tốt để sếp không bắt bẻ được', res: [
          { w: 2, t: `Sau 2 tuần, ${c.boss} hết cớ soi. Ban giám đốc còn để ý tới bạn vì làm tốt việc khó.`, f: 2 },
          { w: 1, t: 'Áp lực quá, bạn mất ngủ cả tuần. Người ấy lo lắng khuyên bạn đừng ôm hết vào người.', f: 1 } ] },
        { label: 'Xin chuyển sang phòng khác', res: [
          { t: `Phòng mới vui vẻ hơn hẳn, trưởng phòng mới rất quý bạn. Thoát khỏi ${c.boss}!`, f: 1, m: 1, flag: 'new_boss' } ] },
        { label: 'Nộp đơn nghỉ việc luôn', res: [
          { t: 'Bạn nộp đơn, dọn bàn, ngẩng cao đầu ra về. Phải tìm chỗ mới thôi.', fired: true, next: 'newjob' } ] },
      ] },
    { id: 'affair_wife', icon: '📞', title: `${c.wife} tìm đến công ty`,
      text: `${c.wife} — vợ ${c.boss} — kéo bạn ra góc hành lang: "Em có biết gì không? Chị thấy anh ấy thay đổi lắm…"`,
      choices: [
        { label: 'Mách hết sự thật', res: [
          { w: 2, t: `${c.wife} cảm ơn bạn trong nước mắt. Hai hôm sau, ${c.boss} gọi bạn lên phòng: "Từ mai em không cần đi làm nữa." 💥 Bạn bị đuổi việc!`, fired: true, flag: 'told_wife', next: 'newjob' },
          { w: 1, t: `${c.wife} hóa ra là cổ đông lớn của công ty! ${c.boss} bị cách chức, còn bạn được đề bạt vì trung thực.`, role: 'leader', f: 0, flag: 'new_boss' } ] },
        { label: 'Bảo không biết gì', res: [
          { t: `${c.wife} buồn bã ra về. Đêm đó bạn trằn trọc mãi, kể cho người ấy nghe rồi mới ngủ được.`, f: 1 } ] },
        { label: 'Khuyên chị nói chuyện thẳng với chồng', res: [
          { t: `Tuần sau thấy ${c.boss} ngoan hẳn, tan làm về đúng giờ. Bạn thở phào.`, m: 1 } ] },
      ] },

    // ════════ Tìm việc mới (sau khi nghỉ / bị đuổi) ════════
    { id: 'newjob', icon: '📦', title: 'Ôm thùng các-tông… rồi đi phỏng vấn',
      text: 'Sau vài ngày rải CV, có 3 nơi gọi phỏng vấn. Chọn đi đâu đây?',
      choices: [
        { label: `${COMPANIES[1].icon} ${COMPANIES[1].name} — lương +10%, sếp hiền`, res: [
          { w: 2, t: `Phỏng vấn trơn tru! Bạn là nhân viên mới của ${COMPANIES[1].name}.`, company: 1 },
          { w: 1, t: `Trượt vòng 1 vì… đến muộn do kẹt xe. Nhưng ${COMPANIES[2].name} gọi lại nhận bạn luôn!`, company: 2 } ] },
        { label: `${COMPANIES[2].icon} ${COMPANIES[2].name} — lương +20%, hơi áp lực`, res: [
          { t: 'Studio trẻ trung, bàn làm việc đầy cây xanh. Bạn hồi hộp ngày đầu đi làm.', company: 2 } ] },
        { label: `${COMPANIES[3].icon} ${COMPANIES[3].name} — lương +35%, tăng ca nhiều`, res: [
          { w: 2, t: 'Tập đoàn lớn, thang máy kính, căng tin ngon. Lương cao nhưng chắc là ít thời gian rảnh…', company: 3 },
          { w: 1, t: `Vào vòng cuối thì gặp lại… ${c.boss} cũ đang làm giám khảo! Bạn đành sang ${COMPANIES[1].name}.`, company: 1 } ] },
      ] },

    // ════════ Thăng tiến ════════
    { id: 'promote', start: true, icon: '⭐', title: 'Đề bạt lên leader', when: j => j.role === 'staff' && j.favor >= 4 && j.days >= 6,
      text: `${c.boss} gọi bạn vào phòng: "Thời gian qua em làm tốt. Anh muốn em làm trưởng nhóm, quản 3 bạn. Em nhận không?"`,
      choices: [
        { label: 'Nhận lời', res: [
          { w: 3, t: '🎉 Bạn lên Trưởng nhóm! Lương tăng, cả nhóm mua bánh chúc mừng.', role: 'leader', f: 1 },
          { w: 1, t: `🎉 Bạn lên Trưởng nhóm… nhưng ${c.mate} cũng nhắm vị trí này, mặt anh ấy hơi xị.`, role: 'leader', m: -2, next: 'rival' } ] },
        { label: 'Xin thêm thời gian học hỏi', res: [
          { t: `${c.boss} gật đầu: "Được, anh chờ." Sếp quý bạn vì sự khiêm tốn.`, f: 2 } ] },
      ] },
    { id: 'rival', icon: '🥊', title: 'Cuộc chiến ghế leader',
      text: `${c.mate} bắt đầu cạnh tranh ngầm: họp nào cũng phản biện ý bạn, còn rủ cả nhóm đi ăn mà không gọi bạn.`,
      choices: [
        { label: 'Mời riêng anh ấy đi cà phê nói chuyện thẳng thắn', res: [
          { w: 2, t: `Hai người nói hết lòng. ${c.mate} thừa nhận ghen tị, giờ thành cánh tay phải của bạn.`, m: 3 },
          { w: 1, t: `${c.mate} vẫn ấm ức, nhưng ít ra không còn chơi xấu nữa.`, m: 1 } ] },
        { label: 'Chứng minh bằng kết quả', res: [
          { t: 'Nhóm bạn vượt chỉ tiêu 30%. Không ai còn nghi ngờ năng lực của bạn.', f: 2, bonus: 200 } ] },
        { label: 'Báo sếp chuyện bị chơi xấu', res: [
          { w: 1, t: `${c.boss} nhắc nhở ${c.mate}. Không khí nhóm hơi ngột ngạt một thời gian.`, f: 1, m: -2 },
          { w: 1, t: `${c.boss} bảo: "Leader phải tự xử lý được chứ." Bạn hơi quê.`, f: -1 } ] },
      ] },
    { id: 'conflict', start: true, icon: '⚡', title: 'Hai cấp dưới cãi nhau', when: j => j.role !== 'staff',
      text: `${c.intern} và ${c.mate2} cãi nhau to giữa phòng vì ai làm mất file khách hàng. Cả phòng nhìn bạn — trưởng nhóm.`,
      choices: [
        { label: 'Gọi hai người vào phòng họp, nghe từng người nói', res: [
          { w: 2, t: 'Hóa ra file bị đặt nhầm thư mục. Hai người làm lành, còn rủ nhau đi ăn trưa.', m: 2, f: 1, flag: 'conflict' },
          { w: 1, t: `Lỗi là của ${c.mate2} nhưng chị ấy không nhận. Bạn phải lựa lời rất khéo… cuối cùng chị ấy cũng xin lỗi bé Bông.`, m: 1, flag: 'conflict' } ] },
        { label: 'Phân xử ngay theo lý lẽ', res: [
          { t: 'Nhanh gọn, ai cũng thấy công bằng — dù một người hơi tự ái.', f: 1, m: -1, flag: 'conflict' } ] },
        { label: 'Báo lên sếp để sếp xử', res: [
          { t: `${c.boss} hỏi lại: "Leader mà không tự giải quyết được à?"`, f: -2, flag: 'conflict' } ] },
      ] },
    { id: 'manager', start: true, icon: '🏅', title: 'Ghế trưởng phòng bỏ trống', when: j => j.role === 'leader' && j.favor >= 6 && j.days >= 15,
      text: 'Trưởng phòng cũ nghỉ việc. Ban giám đốc đang cân nhắc bạn và một ứng viên bên ngoài.',
      choices: [
        { label: 'Chuẩn bị bài thuyết trình kế hoạch thật kỹ', res: [
          { w: 2, t: '🏅 Bạn chính thức là Trưởng phòng! Có phòng riêng, có ghế xoay xịn.', role: 'manager', bonus: 500 },
          { w: 1, t: 'Ứng viên bên ngoài được chọn… nhưng ban giám đốc hứa xét bạn đợt sau và thưởng an ủi.', f: 2, bonus: 300 } ] },
        { label: `Nhường cho ${c.mate}`, res: [
          { t: `${c.mate} lên trưởng phòng và luôn nhớ ơn bạn. Cả phòng nể bạn.`, m: 4 } ] },
      ] },
    { id: 'raise', start: true, icon: '💹', title: 'Đề xuất tăng lương', when: j => j.days >= 10,
      text: 'Đã lâu chưa được tăng lương, giá cả thì leo thang. Bạn có nên mở lời với sếp?',
      choices: [
        { label: 'Chuẩn bị bảng thành tích rồi xin gặp sếp', res: [
          { w: 2, t: 'Sếp xem xong gật gù, duyệt thưởng thêm ngay tháng này!', f: 1, bonus: 400 },
          { w: 1, t: 'Sếp hẹn "cuối quý xét". Ít ra sếp đã ghi nhận.', f: 1 } ] },
        { label: 'Dọa nghỉ việc nếu không tăng', res: [
          { w: 1, t: 'Sếp hoảng, tăng lương liền. Nhưng từ đó hơi dè chừng bạn.', bonus: 500, f: -2 },
          { w: 1, t: 'Sếp bình thản: "Vậy em cứ nộp đơn." Bạn đứng hình… và rút lại lời.', f: -3, r: 1 } ] },
        { label: 'Thôi, cố thêm vài tháng', res: [{ t: 'Bạn tiếp tục chăm chỉ. Người ấy bảo: "Cố lên, có em/anh ở đây rồi."' }] },
      ] },

    // ════════ Người theo đuổi ════════
    { id: 'admirer', start: true, icon: '💌', title: `${c.crushShort} có vẻ thích bạn`, when: j => j.days >= 4,
      text: `${c.crush} hay mang bánh sang bàn bạn, hôm nay còn nhắn: "Tối nay đi cà phê với mình không? Mình có chuyện muốn nói…"`,
      choices: [
        { label: 'Từ chối thẳng: "Mình có người yêu rồi"', res: [
          { w: 1, t: `${c.crushShort} cười gượng: "Ừ… mình hiểu." Rồi bỏ đi rất nhanh.`, next: 'admirer_revenge' },
          { w: 1, t: `${c.crushShort} gật đầu: "Người yêu bạn may mắn ghê. Mình vẫn là đồng nghiệp tốt nhé!"`, m: 1 } ] },
        { label: 'Kể ngay cho người ấy nghe rồi mới trả lời', res: [
          { t: `Người ấy bảo: "Từ chối nhẹ nhàng thôi nhé 😤💕". ${c.crushShort} hơi buồn nhưng hiểu chuyện.`, m: 1 } ] },
        { label: 'Mập mờ: "Để hôm khác nha"', res: [
          { t: `${c.crushShort} tưởng còn cơ hội, càng nhiệt tình hơn. Cả phòng bắt đầu đồn hai người "có gì đó"…`, r: 2, next: 'admirer_gossip' } ] },
      ] },
    { id: 'admirer_revenge', icon: '🗣️', title: 'Bị nói xấu sau lưng',
      text: `${c.mate2} kể: ${c.crushShort} đi nói với mọi người rằng bạn "lười, hay đẩy việc", lại còn "tán tỉnh người ta trước"…`,
      choices: [
        { label: 'Đính chính trước cả phòng, đưa tin nhắn làm bằng chứng', res: [
          { w: 2, t: 'Mọi người hiểu ra sự thật. Tiếng xấu tan biến, ai cũng nể bạn bình tĩnh.', r: -3, m: 2 },
          { w: 1, t: `Sự thật sáng tỏ, nhưng ${c.crushShort} xấu hổ quá xin nghỉ việc. Bạn thấy hơi áy náy.`, r: -3 } ] },
        { label: `Nói chuyện riêng với ${c.crushShort}`, res: [
          { t: `${c.crushShort} khóc, xin lỗi vì ghen tức, rồi tự đi đính chính với mọi người.`, r: -2, m: 1 } ] },
        { label: 'Mặc kệ, làm tốt việc của mình', res: [
          { w: 1, t: 'Tin đồn nhạt dần sau vài tuần.', r: -1 },
          { w: 1, t: 'Tin đồn tới tai sếp, sếp gọi bạn lên hỏi chuyện. Phiền phức ghê!', r: 1, f: -1 } ] },
      ] },
    { id: 'admirer_gossip', icon: '📱', title: 'Tin đồn tới tai người ấy',
      text: `Ai đó đăng ảnh bạn đi ăn trưa với ${c.crushShort} lên nhóm chat công ty. Người ấy của bạn vô tình thấy được…`,
      choices: [
        { label: 'Gọi ngay giải thích, kể hết từ đầu', res: [
          { t: `Người ấy giận một chút rồi bảo: "Lần sau từ chối dứt khoát nhé." Bạn từ chối ${c.crushShort} rõ ràng.`, r: -2 } ] },
        { label: `Hẹn ${c.crushShort} nói rõ ràng trước mặt mọi người`, res: [
          { t: 'Mọi chuyện rõ ràng. Người ấy cũng hết giận khi thấy bạn đứng đắn.', r: -2, m: 1 } ] },
      ] },

    // ════════ Mạch nhiều bước khác ════════
    { id: 'trip', start: true, icon: '✈️', title: 'Đi công tác nước ngoài', when: j => j.days >= 5,
      text: 'Công ty cử một người đi công tác 3 ngày. Có hai lựa chọn: Seoul (Hàn Quốc) hoặc Đài Bắc (Đài Loan).',
      choices: [
        { label: '🇰🇷 Đi Seoul', res: [
          { w: 2, t: girl ? 'Seoul lạnh mà vui! Bạn chụp ảnh Namsan gửi người ấy, còn ghé Gwangju tranh thủ gặp nhau một buổi 💕' : 'Ký được hợp đồng lớn ở Seoul, tối về khách sạn gọi video khoe người ấy cả tiếng.', f: 2, bonus: 300 },
          { w: 1, t: 'Chuyến bay bị hoãn 6 tiếng vì tuyết. Bạn ngồi sân bay nhắn tin với người ấy cả buổi.', f: 1 } ] },
        { label: '🇹🇼 Đi Đài Bắc', res: [
          { w: 2, t: girl ? 'Chốt hợp đồng ở Đài Bắc, tối ra chợ đêm Shilin ăn gà rán khổng lồ, gửi ảnh cho người ấy thèm chơi.' : 'Bạn xong việc ở Đài Bắc sớm một ngày, bắt tàu xuống Đài Trung gặp người ấy 💕 Một buổi tối như mơ!', f: 2, bonus: 300 },
          { w: 1, t: 'Bão về, khách hủy hẹn. Bạn kẹt trong khách sạn, ăn mì ly và gọi video với người ấy.', f: 0 } ] },
        { label: 'Nhường cho đồng nghiệp, ở nhà', res: [{ t: `${c.mate2} được đi, mang về cho bạn cả túi quà vặt.`, m: 2 }] },
      ] },
    { id: 'layoff', start: true, icon: '📉', title: 'Tin đồn cắt giảm nhân sự', when: j => j.days >= 8,
      text: 'Công ty làm ăn khó khăn, có tin sẽ cắt giảm 10% nhân sự. Cả phòng lo sốt vó.',
      choices: [
        { label: 'Làm việc chăm chỉ gấp đôi', res: [
          { w: 3, t: 'Danh sách cắt giảm không có tên bạn. Sếp còn khen tinh thần làm việc.', f: 2 },
          { w: 1, t: 'Dù cố gắng, bạn vẫn có tên trong danh sách… Nhận trợ cấp rồi đi tìm việc mới.', fired: true, bonus: 600, next: 'newjob' } ] },
        { label: 'Hỏi thẳng phòng nhân sự', res: [
          { t: 'Nhân sự trấn an: phòng bạn an toàn. Bạn báo tin vui cho cả nhóm.', m: 1 } ] },
        { label: 'Âm thầm rải CV dự phòng', res: [
          { w: 1, t: 'Một công ty khác mời bạn với lương cao hơn. Đổi gió thôi!', company: 2 },
          { w: 1, t: 'Sếp biết bạn đi phỏng vấn chỗ khác, không vui chút nào.', f: -2 } ] },
      ] },
    { id: 'heir', start: true, icon: '👔', title: 'Con sếp vào làm', when: j => j.days >= 6,
      text: `Con trai ${c.boss} vừa tốt nghiệp, được xếp ngồi cạnh bạn. Cậu ta đi muộn về sớm, việc gì cũng nhờ bạn.`,
      choices: [
        { label: 'Kèm cặp tận tình', res: [
          { w: 2, t: `Cậu ấy tiến bộ thấy rõ. ${c.boss} rất cảm kích, xem bạn như người nhà.`, f: 3 },
          { w: 1, t: 'Cậu ấy vẫn lười, còn nhận vơ công bạn. Mệt mỏi ghê.', f: 1, m: -1 } ] },
        { label: 'Từ chối làm hộ, chỉ hướng dẫn', res: [{ t: 'Cậu ấy dỗi một hôm rồi tự làm. Cả phòng thầm khen bạn.', m: 2 }] },
        { label: 'Than phiền với đồng nghiệp', res: [{ t: `Lời than tới tai ${c.boss}. Không khí hơi khó xử…`, f: -2, r: 1 }] },
      ] },

    // ════════ Drama vặt (một bước, nhiều kết cục) ════════
    { id: 'fridge', icon: '🥡', title: 'Ai ăn mất hộp cơm trong tủ lạnh?', text: 'Hộp cơm trưa của bạn trong tủ lạnh chung biến mất. Trên nắp có tờ giấy: "Xin lỗi, đói quá 🙏".',
      choices: [
        { label: 'Dán thông báo hài hước lên tủ lạnh', res: [{ t: 'Cả phòng cười nghiêng ngả, hôm sau có người lén để lại hộp bánh xin lỗi.', m: 1 }] },
        { label: 'Xem camera tìm thủ phạm', res: [{ w: 1, t: 'Thủ phạm là… sếp. Bạn được sếp mời ăn trưa cả tuần.', f: 1 }, { w: 1, t: `Thủ phạm là ${c.intern}, khóc mếu xin lỗi. Bạn tha cho, còn chia nửa bánh mì.`, m: 1 }] },
      ] },
    { id: 'printer', icon: '🖨️', title: 'Máy in kẹt giấy, cả phòng đổ tại bạn', text: 'Máy in kẹt đúng lúc cần in hợp đồng gấp. Ai đó nói: "Lúc nãy thấy bạn in cuối cùng mà."',
      choices: [
        { label: 'Xắn tay sửa máy in', res: [{ w: 2, t: 'Bạn gỡ được tờ giấy kẹt, cả phòng vỗ tay. Biệt danh mới: "thợ máy in".', m: 1 }, { w: 1, t: 'Bạn làm gãy luôn cái khay giấy. Thôi xong…', f: -1 }] },
        { label: 'Gọi kỹ thuật', res: [{ t: 'Kỹ thuật tới sau 2 tiếng. Hợp đồng gửi trễ, sếp không vui.', f: -1 }] },
      ] },
    { id: 'credit', icon: '🏆', title: 'Đồng nghiệp nhận vơ công', text: `Trong cuộc họp, ${c.mate} trình bày ý tưởng bạn nghĩ ra hôm trước như thể của mình.`,
      choices: [
        { label: 'Lên tiếng nhẹ nhàng: "Ý này mình góp hôm thứ Ba nhỉ"', res: [{ t: `${c.boss} ghi nhận công của bạn. ${c.mate} đỏ mặt.`, f: 2, m: -1 }] },
        { label: 'Bỏ qua, lần sau gửi ý tưởng qua email', res: [{ t: 'Bạn rút kinh nghiệm. Lần sau mọi ý tưởng đều có bằng chứng.', m: 1 }] },
      ] },
    { id: 'teambuild', icon: '🏖️', title: 'Team building ở biển', text: 'Công ty tổ chức đi biển 2 ngày, có kéo co và karaoke tập thể.',
      choices: [
        { label: 'Nhiệt tình làm MC', res: [{ w: 2, t: 'Bạn thành ngôi sao của chuyến đi!', m: 2 }, { w: 1, t: 'Bạn hát hỏng một nốt cao, video bị lan khắp công ty 😂', m: 2, r: 1 }] },
        { label: 'Gọi video cho người ấy suốt buổi tối', res: [{ t: 'Bạn bị trêu là "nghiện người yêu", nhưng trông hạnh phúc lắm.' }] },
      ] },
    { id: 'overtime', icon: '⏰', title: 'Bị gọi tăng ca thứ Bảy', text: `${c.boss} nhắn 10 giờ tối thứ Sáu: "Mai qua công ty xíu nhé." Mà mai bạn đã hẹn gọi video cả ngày với người ấy…`,
      choices: [
        { label: 'Xin phép khéo vì đã có hẹn quan trọng', res: [{ w: 2, t: `${c.boss} đồng ý: "Giữ người yêu cho tốt."` }, { w: 1, t: `${c.boss} không nói gì… thứ Hai hơi lạnh nhạt với bạn.`, f: -1 }] },
        { label: 'Đi tăng ca, hứa bù cho người ấy', res: [{ t: 'Sếp khen bạn có trách nhiệm, thưởng tăng ca. Người ấy hơi dỗi nhưng được bù một buổi hẹn.', f: 2, bonus: 150 }] },
      ] },
    { id: 'phish', icon: '🎣', title: 'Email lạ: "Bạn trúng iPhone"', text: 'Một email từ "Phòng IT" yêu cầu bạn bấm link và nhập mật khẩu để nhận quà.',
      choices: [
        { label: 'Báo ngay cho phòng IT thật', res: [{ t: 'Đó là email lừa đảo! IT cảnh báo cả công ty và tuyên dương bạn.', f: 2, bonus: 100 }] },
        { label: 'Bấm thử xem sao', res: [{ w: 1, t: 'Máy bạn bị khóa, IT mất cả buổi sửa. Bạn bị nhắc nhở trước cả phòng.', f: -2, r: 1 }, { w: 1, t: 'Hóa ra là bài kiểm tra an ninh của IT. Bạn phải học lại khóa an toàn mạng 😅', f: -1 }] },
      ] },
    { id: 'elevator', icon: '🛗', title: 'Kẹt thang máy cùng sếp', text: `Thang máy kẹt giữa tầng 7 và 8. Trong thang chỉ có bạn và ${c.boss}…`,
      choices: [
        { label: 'Bắt chuyện vui vẻ cho đỡ sợ', res: [{ w: 2, t: `Hai người nói đủ thứ chuyện, ${c.boss} còn kể về thời trẻ. Từ đó sếp thân thiện hẳn.`, f: 2 }, { w: 1, t: 'Bạn lỡ kể chuyện nói xấu sếp của phòng bên… Sếp cười cười ghi nhớ.', f: -1, r: 1 }] },
        { label: 'Im lặng gọi cứu hộ', res: [{ t: 'Cứu hộ tới sau 20 phút. Không khí hơi gượng, nhưng an toàn.' }] },
      ] },
    { id: 'coffee_spill', icon: '☕', title: 'Đổ cà phê lên áo sếp', text: `Vội vàng chạy vào họp, bạn va phải ${c.boss} — ly cà phê đổ thẳng lên áo sơ mi trắng của sếp.`,
      choices: [
        { label: 'Xin lỗi rối rít, chạy đi mua áo mới', res: [{ w: 2, t: 'Sếp cảm động vì bạn chu đáo, còn khen áo mới đẹp hơn.', f: 1 }, { w: 1, t: 'Áo mới hơi chật, sếp gồng suốt buổi họp 😂', f: 0, m: 1 }] },
        { label: 'Pha trò cho đỡ ngượng', res: [{ w: 1, t: 'Cả phòng phá lên cười, sếp cũng cười theo.', m: 1 }, { w: 1, t: 'Không ai cười. Sếp nhìn bạn rất lâu…', f: -2 }] },
      ] },
    { id: 'award', icon: '🏆', title: 'Bình chọn nhân viên xuất sắc', text: 'Cuối tháng công ty bình chọn nhân viên xuất sắc, cả phòng sẽ bỏ phiếu.',
      choices: [
        { label: 'Bỏ phiếu cho người xứng đáng nhất (không phải mình)', res: [{ w: 1, t: 'Bạn bất ngờ được nhiều người bầu nhất! Giải thưởng tiền mặt về tay.', m: 1, bonus: 300 }, { w: 1, t: `${c.mate2} thắng và cảm ơn lá phiếu của bạn.`, m: 2 }] },
        { label: 'Vận động mọi người bầu cho mình', res: [{ w: 1, t: 'Bạn thắng sát nút nhưng bị chê "chạy giải".', bonus: 300, r: 1 }, { w: 1, t: 'Bạn thua đậm, ngượng chín mặt.', m: -1 }] },
      ] },
    { id: 'matchmake', icon: '💘', title: `${c.mate} thích ${c.mate2}`, text: `${c.mate} thì thầm nhờ bạn làm mai cho mình với ${c.mate2}.`,
      choices: [
        { label: 'Bày kế hoạch "tình cờ" đi ăn chung', res: [{ w: 2, t: 'Kế hoạch thành công! Hai người hẹn hò, mời bạn làm phù dâu/phù rể sau này.', m: 3 }, { w: 1, t: `${c.mate2} phát hiện ra kế hoạch, giận cả hai người mấy hôm.`, m: -1 }] },
        { label: 'Khuyên anh ấy tự tỏ tình', res: [{ t: `${c.mate} lấy hết can đảm tỏ tình… và được đồng ý! Cả phòng ăn bánh mừng.`, m: 2 }] },
      ] },
    { id: 'wfh', icon: '🏠', title: 'Làm việc ở nhà', text: 'Hôm nay công ty cho làm việc từ xa. Chăn ấm, nệm êm…',
      choices: [
        { label: 'Làm nghiêm túc như ở văn phòng', res: [{ t: 'Bạn xong việc sớm, còn dư thời gian gọi video với người ấy.', f: 1 }] },
        { label: 'Ngủ nướng thêm chút', res: [{ w: 1, t: 'Sếp gọi họp video đột xuất — bạn bật cam với mái tóc rối bù và áo ngủ hình gấu 🐻', f: -1, m: 1, r: 1 }, { w: 1, t: 'May mắn không ai gọi. Bạn làm bù buổi chiều, vẫn kịp hạn.' }] },
      ] },
    { id: 'blame', icon: '🎯', title: 'Bị đổ lỗi oan', text: 'Dự án trễ hạn, phòng bên đổ hết lỗi cho nhóm bạn trong cuộc họp ban giám đốc.',
      choices: [
        { label: 'Bình tĩnh trình bày email, mốc thời gian', res: [{ t: 'Bằng chứng rõ ràng, ban giám đốc ghi nhận nhóm bạn làm đúng hạn.', f: 2 }] },
        { label: 'Cãi tay đôi tại chỗ', res: [{ w: 1, t: 'Bạn thắng lý nhưng mất điểm vì nóng nảy.', f: -1 }, { w: 1, t: 'Phòng bên cứng họng, cả nhóm khen bạn bản lĩnh.', m: 2 }] },
      ] },
    { id: 'cake_day', icon: '🎂', title: 'Sinh nhật đồng nghiệp bị quên', text: `Hôm nay sinh nhật ${c.intern} mà cả phòng quên mất, em ấy ngồi buồn thiu.`,
      choices: [
        { label: 'Chạy đi mua bánh, tổ chức bất ngờ giờ nghỉ trưa', res: [{ t: `${c.intern} khóc vì cảm động. Cả phòng nể bạn chu đáo.`, m: 3 }] },
        { label: 'Nhắn chúc mừng riêng', res: [{ t: 'Em ấy cảm ơn bạn, nhưng vẫn hơi buồn.', m: 1 }] },
      ] },
    { id: 'firedrill', icon: '🚒', title: 'Diễn tập cháy nổ', text: 'Chuông báo cháy reo vang — diễn tập! Cả tòa nhà phải xuống bằng thang bộ 15 tầng.',
      choices: [
        { label: 'Dìu đồng nghiệp đang đau chân xuống', res: [{ t: 'Bạn được ban quản lý tòa nhà khen trước toàn công ty.', m: 2, f: 1 }] },
        { label: 'Lẻn trốn trong toilet cho đỡ mệt', res: [{ t: 'Bạn bị bảo vệ tìm ra và ghi tên. Xấu hổ ghê!', f: -1, r: 1 }] },
      ] },
    // ════════ Mạch: khởi nghiệp ════════
    { id: 'startup', start: true, icon: '🚀', title: 'Rủ nhau khởi nghiệp', when: j => j.days >= 12,
      text: `${c.mate} rủ bạn nghỉ việc cùng mở công ty riêng: "Ý tưởng app giao đồ ăn healthy này chắc chắn thắng lớn!"`,
      choices: [
        { label: 'Liều một phen, nghỉ việc làm cùng', res: [
          { w: 1, t: 'Ba tháng cật lực, app được một quỹ đầu tư rót vốn! Bạn bán cổ phần, ôm khoản tiền lớn rồi về làm chỗ mới thoải mái hơn.', bonus: 1500, company: 3 },
          { w: 1, t: 'App không ai dùng, hết sạch vốn sau 2 tháng. Bạn phải đi xin việc lại…', fired: true, next: 'newjob' } ] },
        { label: 'Góp một ít vốn nhưng vẫn đi làm', res: [
          { w: 1, t: 'Công ty nhỏ của Minh có lãi, chia cổ tức cho bạn!', bonus: 400, m: 2 },
          { w: 1, t: 'Mất trắng khoản góp vốn, nhưng tình bạn vẫn còn.', m: 1 } ] },
        { label: 'Từ chối, chúc anh ấy thành công', res: [{ t: `${c.mate} nghỉ việc ra đi. Phòng vắng hẳn một người vui tính.`, m: 1 }] },
      ] },
    // ════════ Mạch: dự án đặc biệt ════════
    { id: 'mentor', start: true, icon: '🧭', title: 'Giám đốc để mắt tới bạn', when: j => j.favor >= 3 && j.days >= 7,
      text: 'Giám đốc khối ghé bàn bạn: "Tôi đọc báo cáo của em rồi. Có một dự án đặc biệt, deadline gắt, em dám nhận không?"',
      choices: [
        { label: 'Nhận ngay!', res: [{ t: 'Bạn được giao dự án đặc biệt. Áp lực đè nặng nhưng cơ hội lớn.', f: 2, next: 'mentor_deadline' }] },
        { label: 'Hỏi rõ phạm vi công việc trước', res: [
          { w: 1, t: 'Giám đốc khen bạn cẩn thận, giao dự án kèm thêm người hỗ trợ.', f: 2, next: 'mentor_deadline' },
          { w: 1, t: 'Giám đốc hơi mất kiên nhẫn, giao dự án cho người khác.', f: -1 } ] },
        { label: 'Từ chối vì muốn dành thời gian cho người ấy', res: [{ t: 'Giám đốc gật đầu tôn trọng. Người ấy nghe chuyện cảm động lắm.' }] },
      ] },
    { id: 'mentor_deadline', icon: '⏳', title: 'Dự án gấp trước giờ G', text: 'Còn 24 tiếng là tới hạn. Một nửa dữ liệu bị lỗi, đồng đội thì ốm.',
      choices: [
        { label: 'Thức trắng đêm làm một mình', res: [
          { w: 2, t: '6 giờ sáng bạn bấm gửi. Dự án thành công rực rỡ, giám đốc thưởng lớn!', f: 3, bonus: 600 },
          { w: 1, t: 'Xong kịp nhưng bạn ngủ gật giữa buổi báo cáo. Vẫn được ghi nhận, nhưng hơi quê.', f: 1, bonus: 200 } ] },
        { label: 'Xin lùi hạn 1 ngày, làm cho chắc', res: [{ w: 1, t: 'Giám đốc đồng ý. Sản phẩm chỉn chu, khách hàng hài lòng.', f: 2 }, { w: 1, t: 'Khách hàng không chờ được, dự án bị hủy. Tiếc ghê.', f: -2 }] },
        { label: 'Huy động cả nhóm cùng làm', res: [{ t: 'Cả nhóm thức đêm cùng bạn, pizza bày la liệt. Xong sớm hơn dự kiến!', m: 3, f: 2 }] },
      ] },
    // ════════ Mạch: kiểm toán ════════
    { id: 'audit', start: true, icon: '🧮', title: 'Sổ sách có vấn đề', when: j => j.days >= 9,
      text: `Đối chiếu số liệu, bạn phát hiện ${c.mate2} khai khống tiền tiếp khách gần 10 triệu.`,
      choices: [
        { label: 'Hỏi riêng chị ấy trước', res: [
          { w: 2, t: 'Chị ấy tái mặt, xin hoàn lại tiền và hứa không tái phạm. Bạn giữ kín chuyện.', m: 1, next: 'audit_after' },
          { w: 1, t: 'Chị ấy chối phăng rồi đi nói xấu bạn "soi mói".', r: 2, m: -2 } ] },
        { label: 'Báo thẳng lên kế toán trưởng', res: [{ t: `${c.mate2} bị kỷ luật. Sếp khen bạn liêm chính, nhưng phòng hơi lạnh nhạt với bạn.`, f: 3, m: -2 }] },
        { label: 'Làm ngơ', res: [{ w: 1, t: 'Không ai biết chuyện… cho tới khi kiểm toán phát hiện, bạn cũng bị hỏi vì sao không báo.', f: -2 }, { w: 1, t: 'Mọi chuyện chìm xuồng. Nhưng lương tâm bạn hơi cắn rứt.' }] },
      ] },
    { id: 'audit_after', icon: '🤝', title: 'Món nợ ân tình', text: `${c.mate2} biết ơn bạn, hôm nay rỉ tai: "Chị biết vài chuyện nội bộ có thể giúp em thăng tiến…"`,
      choices: [
        { label: 'Nghe thử', res: [{ w: 1, t: 'Tin đúng: sắp có vị trí trống. Bạn chuẩn bị trước và gây ấn tượng mạnh.', f: 3 }, { w: 1, t: 'Tin sai bét, bạn hớn hở báo cáo nhầm. Quê ơi là quê.', f: -1 }] },
        { label: 'Cảm ơn nhưng không cần', res: [{ t: 'Chị ấy nể bạn, từ đó hai người thành bạn thật.', m: 2 }] },
      ] },
    // ════════ Mạch: khách hàng tán tỉnh ════════
    { id: 'flirty_client', start: true, icon: '🌹', title: 'Khách hàng VIP tán tỉnh', when: j => j.days >= 5,
      text: 'Một khách hàng lớn liên tục nhắn tin ngoài giờ, gửi hoa tới công ty và mời bạn ăn tối riêng "để bàn hợp đồng".',
      choices: [
        { label: 'Lịch sự đề nghị chỉ gặp ở công ty, có đồng nghiệp đi cùng', res: [
          { w: 2, t: 'Khách hiểu ý, hợp đồng vẫn ký bình thường. Sếp khen bạn chuyên nghiệp.', f: 2 },
          { w: 1, t: 'Khách phật ý, rút hợp đồng. Sếp tiếc nhưng ủng hộ bạn.', f: 0, next: 'client_revenge' } ] },
        { label: 'Kể với người ấy rồi chặn số khách', res: [{ t: 'Người ấy ôm bạn qua video. Khách chuyển sang làm việc với đồng nghiệp khác.', f: -1 }] },
        { label: 'Đi ăn cho xong hợp đồng', res: [{ t: 'Bữa tối khó xử, khách nói nhiều câu vượt giới hạn. Bạn bỏ về giữa chừng.', r: 1, next: 'client_revenge' }] },
      ] },
    { id: 'client_revenge', icon: '😤', title: 'Khách hàng gây khó dễ', text: 'Vị khách kia gửi email phàn nàn bạn "thái độ kém" lên ban giám đốc.',
      choices: [
        { label: 'Gửi toàn bộ tin nhắn làm bằng chứng', res: [{ t: 'Ban giám đốc đứng về phía bạn, cắt hợp tác với vị khách đó. Cả công ty nể bạn.', f: 3, r: -1 }] },
        { label: 'Im lặng chịu trận', res: [{ t: 'Bạn bị trừ điểm đánh giá tháng này. Ấm ức ghê!', f: -2 }] },
      ] },

    // ════════ Drama vặt (thêm cho đỡ lặp) ════════
    { id: 'aircon', icon: '❄️', title: 'Chiến tranh điều hòa', text: 'Nửa phòng kêu nóng, nửa phòng kêu lạnh. Remote điều hòa bị giấu đi đâu mất.',
      choices: [{ label: 'Đề xuất bỏ phiếu nhiệt độ', res: [{ t: 'Cả phòng chốt 26 độ. Hòa bình lập lại!', m: 2 }] }, { label: 'Lén chỉnh theo ý mình', res: [{ w: 1, t: 'Bị bắt quả tang, cả phòng trêu bạn "trùm điều hòa".', r: 1 }, { w: 1, t: 'Không ai biết. Bạn mát rượi cả chiều.' }] }] },
    { id: 'microwave', icon: '🐟', title: 'Mùi cá kho trong lò vi sóng', text: 'Ai đó hâm cá kho làm cả tầng bốc mùi. Sếp đi qua nhăn mặt.',
      choices: [{ label: 'Mở cửa sổ, xịt thơm, dán nội quy lò vi sóng', res: [{ t: 'Phòng thơm tho trở lại, nội quy mới được hưởng ứng.', m: 1, f: 1 }] }, { label: 'Thú nhận: "Cá kho của mẹ mình gửi…"', res: [{ t: 'Mọi người xin nếm thử và… khen ngon! Hôm sau ai cũng nhờ bạn mang thêm.', m: 2 }] }] },
    { id: 'karaoke_boss', icon: '🎤', title: 'Sếp hát karaoke', text: `Tiệc công ty, ${c.boss} giành micro hát… lệch tông toàn tập rồi hỏi: "Anh hát hay không?"`,
      choices: [{ label: 'Khen hết lời', res: [{ w: 1, t: 'Sếp vui lắm, hát thêm 5 bài nữa. Cả phòng nhìn bạn oán trách 😂', f: 2, m: -1 }, { w: 1, t: 'Sếp nghe biết khen giả, cười trừ.', f: 0 }] }, { label: 'Song ca cùng sếp cứu bài', res: [{ t: 'Hai người song ca tình bể bình, video thành "huyền thoại" của công ty.', f: 2, m: 2 }] }] },
    { id: 'meme', icon: '😂', title: 'Ảnh chế về sếp lan truyền', text: 'Ai đó chế ảnh sếp ngủ gật trong họp, lan khắp nhóm chat. Sếp đang đi tìm "thủ phạm".',
      choices: [{ label: 'Không chia sẻ thêm, khuyên mọi người xóa', res: [{ t: 'Sếp biết bạn không dính líu, còn đánh giá cao sự chừng mực.', f: 1 }] }, { label: 'Thả "haha" vào ảnh', res: [{ w: 1, t: 'Sếp đọc được nhóm chat… và nhớ tên bạn.', f: -2 }, { w: 1, t: 'Sếp cũng thả haha! Hóa ra sếp rất vui tính.', f: 1, m: 1 }] }] },
    { id: 'charity', icon: '💝', title: 'Quyên góp từ thiện', text: 'Công ty kêu gọi quyên góp cho trẻ em vùng lũ.',
      choices: [{ label: 'Đứng ra tổ chức quyên góp cả phòng', res: [{ t: 'Phòng bạn góp nhiều nhất công ty! Ban giám đốc gửi thư khen.', f: 2, m: 2 }] }, { label: 'Góp một phần lặng lẽ', res: [{ t: 'Bạn góp phần nhỏ, thấy lòng nhẹ nhõm.', m: 1 }] }] },
    { id: 'interview_ex', icon: '😳', title: 'Phỏng vấn người yêu cũ', text: 'Bạn được cử phỏng vấn ứng viên mới… và đó là người yêu cũ của bạn!',
      choices: [{ label: 'Xin đổi người phỏng vấn cho khách quan', res: [{ t: 'Sếp đánh giá cao sự minh bạch. Người ấy nghe kể thì bật cười.', f: 2 }] }, { label: 'Phỏng vấn bình thường', res: [{ w: 1, t: 'Ứng viên được nhận… giờ thành đồng nghiệp. Hơi gượng gạo đây.', r: 1 }, { w: 1, t: 'Ứng viên trượt. Không ai biết chuyện cũ.' }] }] },
    { id: 'dresscode', icon: '👔', title: 'Quy định đồng phục mới', text: 'Công ty bắt mặc vest mỗi thứ Hai giữa mùa nóng 35 độ.',
      choices: [{ label: 'Gửi góp ý xin đổi sang áo polo có logo', res: [{ w: 2, t: 'Đề xuất được duyệt! Cả công ty biết ơn bạn.', m: 3 }, { w: 1, t: 'Đề xuất bị bác. Ít nhất bạn đã thử.', m: 1 }] }, { label: 'Chấp hành nghiêm túc', res: [{ t: 'Sếp khen bạn chỉn chu. Mồ hôi thì ướt đẫm 😅', f: 1 }] }] },
    { id: 'blackout', icon: '🔌', title: 'Mất điện cả tòa nhà', text: 'Đang làm dở báo cáo thì mất điện. File chưa lưu…',
      choices: [{ label: 'Rủ cả phòng xuống quán cà phê làm tiếp', res: [{ t: 'Buổi làm việc "dã ngoại" vui bất ngờ, ý tưởng tuôn trào.', m: 2 }] }, { label: 'Ngồi chờ có điện', res: [{ w: 1, t: 'Có điện lại sau 10 phút, file tự khôi phục! May quá.' }, { w: 1, t: 'Mất trắng file. Bạn làm lại tới tối.', f: 0 }] }] },
    { id: 'lucky_draw', icon: '🎰', title: 'Bốc thăm may mắn', text: 'Tiệc tất niên có bốc thăm trúng thưởng. Bạn cầm phiếu số 88.',
      choices: [{ label: 'Hồi hộp chờ quay số', res: [{ w: 1, t: '🎉 Số 88! Bạn trúng giải nhất!', bonus: 800 }, { w: 2, t: 'Trúng giải khuyến khích: một chai nước mắm 😂', bonus: 50 }, { w: 2, t: 'Không trúng gì, nhưng bữa tiệc vui.' }] }, { label: 'Tặng phiếu cho bé thực tập', res: [{ t: `${c.intern} trúng giải nhì, chia cho bạn một nửa!`, m: 2, bonus: 200 }] }] },
    { id: 'office_cat', icon: '🐈', title: 'Mèo hoang lạc vào văn phòng', text: 'Một chú mèo con lạc vào văn phòng, kêu meo meo dưới gầm bàn bạn.',
      choices: [{ label: 'Cho ăn và nhận nuôi làm "mèo công ty"', res: [{ w: 2, t: 'Mèo trở thành linh vật, cả phòng yêu quý. Sếp cũng hay lén vuốt nó.', m: 3 }, { w: 1, t: 'Mèo cào nát ghế sofa phòng khách. Sếp không vui…', f: -1, m: 1 }] }, { label: 'Đưa tới trạm cứu hộ', res: [{ t: 'Mèo được nhận nuôi bởi một gia đình tốt. Bạn yên tâm.', m: 1 }] }] },
    { id: 'review360', icon: '📝', title: 'Đánh giá chéo 360 độ', text: 'Mọi người phải chấm điểm lẫn nhau, kể cả chấm sếp.',
      choices: [{ label: 'Chấm thật lòng, góp ý xây dựng', res: [{ w: 2, t: 'Bạn nhận lại nhiều góp ý tích cực. Sếp thay đổi vài điều nhờ góp ý của bạn.', f: 1, m: 1 }, { w: 1, t: 'Ai đó chấm bạn rất thấp, bạn đoán mãi không ra là ai.', m: -1 }] }, { label: 'Chấm điểm cao hết cho êm', res: [{ t: 'Êm thì êm, nhưng chẳng ai tiến bộ.' }] }] },
    { id: 'english_pitch', icon: '🌏', title: 'Thuyết trình bằng tiếng Anh', text: 'Đối tác nước ngoài tới, sếp chỉ định bạn thuyết trình bằng tiếng Anh — sau 30 phút nữa!',
      choices: [{ label: 'Hít sâu, nói chậm, dùng nhiều hình minh họa', res: [{ w: 2, t: '"Great presentation!" — đối tác khen. Sếp giơ ngón cái.', f: 3 }, { w: 1, t: 'Bạn lắp bắp vài chỗ nhưng đối tác vẫn hiểu và rất thân thiện.', f: 1 }] }, { label: 'Nhờ đồng nghiệp giỏi tiếng Anh nói thay', res: [{ t: 'Buổi thuyết trình ổn, nhưng sếp hơi thất vọng.', f: -1, m: 1 }] }] },
    { id: 'storm_late', icon: '🌧️', title: 'Bão lớn, đi làm muộn', text: 'Mưa bão ngập đường, bạn kẹt xe và đến muộn 1 tiếng đúng ngày có họp quan trọng.',
      choices: [{ label: 'Nhắn báo trước và họp online trên đường', res: [{ t: 'Bạn họp qua điện thoại dưới mái hiên. Sếp khen bạn xoay xở giỏi.', f: 2 }] }, { label: 'Phóng nhanh cho kịp', res: [{ w: 1, t: 'Xe chết máy giữa đường ngập. Ướt như chuột lột!', f: -1 }, { w: 1, t: 'Kịp giờ trong tình trạng ướt sũng, cả phòng đưa khăn cho bạn.', m: 1 }] }] },
    { id: 'diet_contest', icon: '🥗', title: 'Cuộc thi giảm cân của phòng', text: 'Cả phòng thi giảm cân 1 tháng, ai giảm nhiều nhất được 500 nghìn.',
      choices: [{ label: 'Tham gia nghiêm túc, rủ người ấy tập cùng qua video', res: [{ w: 1, t: 'Bạn về nhất! Người ấy khen dáng đẹp hẳn.', bonus: 250, m: 1 }, { w: 1, t: 'Tuần cuối gục ngã trước trà sữa. Về nhì vẫn vui!', m: 1 }] }, { label: 'Làm trọng tài, giữ bánh kẹo của mọi người', res: [{ t: 'Bạn "tịch thu" bánh kẹo… và ăn hết. Ai cũng cười.', m: 2 }] }] },
    { id: 'noisy', icon: '📞', title: 'Đồng nghiệp gọi điện oang oang', text: 'Người ngồi cạnh nói điện thoại rất to cả buổi, bạn không thể tập trung.',
      choices: [{ label: 'Tặng anh ấy một tai nghe có mic', res: [{ t: 'Anh ấy ngượng ngùng cảm ơn, từ đó nói nhỏ hẳn.', m: 2 }] }, { label: 'Phàn nàn với sếp', res: [{ t: 'Sếp nhắc chung cả phòng. Người kia đoán ra bạn, hơi giận.', m: -1 }] }] },
    { id: 'keycard', icon: '🪪', title: 'Quên thẻ ra vào', text: 'Bạn quên thẻ, bị kẹt ngoài cửa đúng lúc ban giám đốc đi qua.',
      choices: [{ label: 'Chào hỏi tự nhiên, nhờ mở cửa', res: [{ w: 1, t: 'Giám đốc vui vẻ mở cửa, còn hỏi han công việc của bạn.', f: 1 }, { w: 1, t: 'Giám đốc nhắc nhở: "Lần sau nhớ mang thẻ nhé."' }] }, { label: 'Đứng nép vào chờ đồng nghiệp', res: [{ t: `Đợi 15 phút, ${c.intern} tới mở giúp kèm ly trà sữa.`, m: 1 }] }] },
    { id: 'coffee_machine', icon: '☕', title: 'Máy pha cà phê mới', text: 'Công ty mua máy pha cà phê xịn nhưng chẳng ai biết dùng. Ai đó làm trào sữa khắp nơi.',
      choices: [{ label: 'Xem video hướng dẫn, dạy cả phòng', res: [{ t: 'Bạn thành "barista" của phòng, sáng nào cũng có người nhờ pha.', m: 2 }] }, { label: 'Chụp ảnh cảnh sữa trào gửi nhóm chat', res: [{ t: 'Cả phòng cười cả buổi sáng.', m: 1 }] }] },
    { id: 'plant_dying', icon: '🪴', title: 'Cây văn phòng sắp chết', text: 'Chậu cây kim tiền của sếp héo rũ trong lúc sếp đi công tác.',
      choices: [{ label: 'Chăm sóc tận tình, thay đất mới', res: [{ w: 2, t: 'Cây xanh tốt trở lại. Sếp về thấy, cảm động lắm.', f: 2 }, { w: 1, t: 'Cây vẫn chết. Bạn mua cây mới y hệt thay vào… sếp không biết gì.', f: 1 }] }, { label: 'Kệ, không phải việc mình', res: [{ t: 'Sếp về thấy cây chết, buồn cả ngày.' }] }] },
    { id: 'gossip', icon: '☕', title: 'Hội buôn chuyện giờ giải lao', text: `${c.mate2} kéo bạn vào hội buôn: "Nghe nói phòng bên sắp có người nghỉ việc đó…"`,
      choices: [{ label: 'Nghe cho vui nhưng không lan truyền', res: [{ t: 'Bạn biết thêm tin mà không mất điểm với ai.', m: 1 }] }, { label: 'Kể thêm chuyện mình biết', res: [{ w: 1, t: 'Chuyện lan khắp công ty, tới tai người trong cuộc. Mệt rồi đây…', r: 2 }, { w: 1, t: 'Cả hội thích bạn ra mặt.', m: 2, r: 1 }] }] },
    { id: 'bonus', icon: '💰', title: 'Thưởng nóng cuối tháng', text: 'Phòng bạn đạt chỉ tiêu, sếp thưởng nóng cả nhóm.',
      choices: [{ label: 'Đi ăn mừng cùng nhóm', res: [{ t: 'Bữa ăn vui vẻ, bạn chụp ảnh gửi người ấy.', m: 1, bonus: 200 }] }, { label: 'Về sớm mua quà cho người ấy', res: [{ t: 'Bạn chọn quà cả buổi tối. Mong người ấy thích!', bonus: 200 }] }] },
    { id: 'intern_cry', icon: '😢', title: 'Thực tập sinh bị khách mắng', text: `${c.intern} bị khách hàng mắng xối xả qua điện thoại, ngồi khóc ở cầu thang.`,
      choices: [{ label: 'Ra an ủi, gọi lại cho khách xử lý giúp', res: [{ t: `Khách dịu lại khi nghe bạn giải thích. ${c.intern} coi bạn như thần tượng.`, m: 3 }] }, { label: 'Dạy em ấy cách xử lý cuộc gọi khó', res: [{ t: 'Lần sau em ấy tự xử lý được. Bạn thấy tự hào.', m: 2, f: 1 }] }] },
  ];
}

const seenKey = (id: string) => `s:${id}`;
/** Drama hôm nay (nếu tới ngày): bước nối tiếp → mạch mới đủ điều kiện chưa gặp → drama vặt chưa gặp (hết vòng thì làm mới) */
export function dramaToday(job: JobData, girl: boolean, date: string): Drama | null {
  if (job.drama?.day === date) return dramas(job, girl).find(d => d.id === job.drama!.id) ?? null;
  if (!workday(date) || date < job.nextDay) return null;
  const all = dramas(job, girl);
  if (job.next) { const d = all.find(x => x.id === job.next); if (d) return d; }
  const fresh = (d: Drama) => !job.flags.includes(seenKey(d.id));
  const r = seeded(`drama:${date}`);
  const starts = all.filter(d => d.start && fresh(d) && (d.when ? d.when(job) : true));
  const singles = all.filter(d => !d.start && !d.when && d.choices.length && fresh(d) && !isFollowUp(d.id));
  // mạch truyện lớn xen kẽ drama vặt cho đỡ đoán trước
  const pool = starts.length && (r() < 0.6 || !singles.length) ? starts : singles;
  if (pool.length) return pool[Math.floor(r() * pool.length)];
  // đã gặp hết drama vặt → bắt đầu vòng mới (bỏ dấu "đã gặp" của drama vặt)
  const again = all.filter(d => !d.start && !isFollowUp(d.id));
  return again.length ? again[Math.floor(r() * again.length)] : null;
}
const FOLLOW = new Set(['sick', 'minh_mistake', 'affair_bribe', 'affair_photo', 'affair_cold', 'affair_wife', 'newjob', 'rival', 'admirer_revenge', 'admirer_gossip']);
const isFollowUp = (id: string) => FOLLOW.has(id);

/** Chọn một hướng → kết cục (may rủi) → cập nhật công việc */
export function applyChoice(job: JobData, d: Drama, i: number, date: string): { job: JobData; result: Result } {
  const ch = d.choices[i];
  const tot = ch.res.reduce((s, x) => s + (x.w ?? 1), 0);
  let roll = seeded(`res:${date}:${d.id}:${i}:${job.days}`)() * tot;
  const res = ch.res.find(x => (roll -= x.w ?? 1) < 0) ?? ch.res[ch.res.length - 1];
  const gap = 4 + (seeded(`gap:${date}`)() < 0.5 ? 0 : 1);
  let flags = job.flags.includes(seenKey(d.id)) ? [...job.flags] : [...job.flags, seenKey(d.id)];
  if (res.flag && !flags.includes(res.flag)) flags = [...flags, res.flag];
  const j: JobData = {
    ...job,
    favor: clamp(job.favor + (res.f ?? 0)), mates: clamp(job.mates + (res.m ?? 0)), rumor: clamp(job.rumor + (res.r ?? 0), 0, 10),
    flags,
    drama: { id: d.id, day: date, picked: i, text: res.t },
    next: res.next ?? null,
    nextDay: addDays(date, res.next ? 2 : gap),
    log: [...job.log, { day: date, title: d.title, text: `${ch.label} → ${res.t}` }].slice(-40),
  };
  if (res.role) j.role = res.role;
  if (res.fired) { j.role = 'staff'; j.favor = 0; }
  if (res.company !== undefined) { j.company = res.company; j.role = 'staff'; j.favor = 0; j.since = date; }
  return { job: j, result: res };
}
