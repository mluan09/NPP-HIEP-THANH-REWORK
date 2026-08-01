import { useMemo, useState } from 'react';
import { Bug, Copy, ExternalLink, Mail, MessageCircle, Send, Smartphone } from 'lucide-react';
import { contactConfig } from '../data/contact-config';
import { useToast } from '../components/Toast';

type FeedbackType = 'gop-y' | 'bao-loi';

export const FeedbackPage: React.FC = () => {
  const { showToast } = useToast();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('gop-y');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const zaloLink = useMemo(() => {
    const phone = contactConfig.zaloPhone.replace(/\D/g, '');
    return `https://zalo.me/${phone}`;
  }, []);

  const mailLink = useMemo(() => {
    const subjectPrefix = feedbackType === 'bao-loi' ? 'Báo lỗi website' : 'Góp ý website';
    const subject = `${subjectPrefix}${title.trim() ? ` - ${title.trim()}` : ''}`;
    const body = [
      `Loại: ${feedbackType === 'bao-loi' ? 'Báo lỗi' : 'Góp ý'}`,
      `Tiêu đề: ${title.trim() || '(chưa nhập)'}`,
      '',
      'Nội dung:',
      content.trim() || '(chưa nhập)',
      '',
      `Thời gian gửi: ${new Date().toLocaleString('vi-VN')}`,
    ].join('\n');

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactConfig.gmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [content, feedbackType, title]);

  const handleCopyPhone = async () => {
    await navigator.clipboard.writeText(contactConfig.zaloPhone);
    showToast('Đã sao chép SĐT Zalo');
  };

  const handleSubmit = () => {
    window.open(mailLink, '_blank', 'noopener,noreferrer');
    showToast('Đang mở Gmail trên trình duyệt để gửi góp ý');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 shadow-lg shadow-amber-500/20 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Hỗ trợ developer</p>
            <h2 className="text-2xl font-extrabold mt-2">Góp ý & Báo lỗi website</h2>
            <p className="text-white/80 mt-2 max-w-2xl">
              Gửi góp ý cải thiện web hoặc báo lỗi bạn gặp phải qua Gmail hoặc SĐT Zalo của developer.
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
            <MessageCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nội dung gửi developer</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nhập thông tin bên dưới rồi bấm gửi để mở Gmail trên trình duyệt với nội dung đã điền sẵn.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setFeedbackType('gop-y')}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                feedbackType === 'gop-y'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Góp ý cải thiện</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType('bao-loi')}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                feedbackType === 'bao-loi'
                  ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Bug className="w-5 h-5" />
              <span className="font-semibold">Báo lỗi website</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tiêu đề
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Lỗi không lưu đơn hàng hoặc góp ý thêm báo cáo..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nội dung chi tiết
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả góp ý hoặc lỗi bạn gặp. Nếu báo lỗi, hãy ghi thao tác đã làm và màn hình đang dùng."
                rows={8}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-slate-100 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer"
            >
              <Mail className="w-5 h-5" />
              Gửi qua Gmail
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Gmail developer</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-all">{contactConfig.gmail}</p>
              </div>
            </div>
            <a
              href={mailLink}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/20 text-sm font-semibold transition-colors"
            >
              Mở Gmail
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">SĐT Zalo</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{contactConfig.zaloPhone}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <a
                href={zaloLink}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/20 text-sm font-semibold transition-colors"
              >
                Nhắn Zalo
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Sao chép SĐT
              </button>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 text-amber-700 dark:text-amber-300">
            <p className="text-sm font-semibold">Cách đổi Gmail và SĐT Zalo</p>
            <p className="text-sm mt-2 text-amber-700/80 dark:text-amber-300/80">
              Mở file <span className="font-mono font-bold">src/data/contact-config.ts</span>, sửa <span className="font-mono">gmail</span> và <span className="font-mono">zaloPhone</span>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};