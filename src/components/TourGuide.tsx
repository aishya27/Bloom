import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Language } from "../translations";
import { 
  Sparkles, 
  X, 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Flower2, 
  ShieldCheck, 
  Globe
} from "lucide-react";

interface TourGuideProps {
  language: Language;
  onLanguageSelect?: (lang: Language) => void;
  isOpen?: boolean;
  onClose?: () => void;
  plantName?: string;
  plantEmoji?: string;
  manualTrigger?: boolean;
  onDismiss?: () => void;
}

export default function TourGuide({
  language,
  onLanguageSelect,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  plantName = "Bloom Guardian Plant",
  plantEmoji = "🌱",
  manualTrigger = false,
  onDismiss,
}: TourGuideProps) {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  // Determine if modal is active from external prop or internal state
  const isControlled = typeof externalIsOpen === "boolean";
  const activeIsOpen = isControlled ? externalIsOpen : internalIsOpen;

  // Freeze background page scrolling when TourGuide / Language / Tutorial modal is open
  useEffect(() => {
    if (activeIsOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [activeIsOpen]);

  useEffect(() => {
    if (manualTrigger) {
      setInternalIsOpen(true);
      setStep(0);
      return;
    }

    if (!isControlled) {
      const seen = localStorage.getItem("bloom_tour_guide_seen");
      if (!seen) {
        const timer = setTimeout(() => {
          setInternalIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [manualTrigger, isControlled]);

  const handleClose = () => {
    setInternalIsOpen(false);
    localStorage.setItem("bloom_tour_guide_seen", "true");
    if (externalOnClose) externalOnClose();
    if (onDismiss) onDismiss();
  };

  const handleOpenManual = () => {
    setStep(0);
    if (isControlled && externalOnClose) {
      // If controlled externally, reset step
      setStep(0);
    } else {
      setInternalIsOpen(true);
    }
  };

  const slidesByLanguage = {
    en: [
      {
        title: "Welcome to Bloom 🌸",
        subtitle: "Your journey to a smoke-free, thriving life starts here.",
        description: "Bloom nurtures your habit change with gentle daily check-ins, habit tracking, and digital plant growth.",
        highlights: [
          "💧 Daily check-ins water your plant & streak",
          "🛡️ Earn Shields to protect your progress",
          "🏆 Grow from Seedling 🌱 to Master Bloom 🌸"
        ],
        accentBg: "from-emerald-600 via-teal-600 to-emerald-800",
        isLangPicker: true,
        emoji: "🌸",
      },
      {
        title: "Daily Check-Ins 📅",
        subtitle: "Building momentum one day at a time.",
        description: "Log your status every day in seconds. Choose whether you stayed smoke-free, or log a slip with complete compassion & zero judgment.",
        highlights: [
          "✨ Keep your streak active with zero pressure",
          "📝 Optional journal logs to reflect on triggers",
          "🪙 Earn coins & XP for every check-in"
        ],
        accentBg: "from-teal-600 via-emerald-600 to-teal-800",
        emoji: "📅",
      },
      {
        title: "Your Digital Plant 🌱",
        subtitle: "Watch your dedication bloom into reality.",
        description: "Your plant thrives on your commitment. Higher streaks unlock unique growth stages, avatars, and rare plant varieties.",
        highlights: [
          "🎋 Watch plant growth reflect your streak",
          "🪴 Choose from Bonsai, Bamboo, Lavender & Sunflower",
          "🌟 Complete quests to earn fertilizers & shields"
        ],
        accentBg: "from-emerald-600 via-green-600 to-emerald-800",
        emoji: plantEmoji,
      },
      {
        title: "Craving Emergency SOS 🚨",
        subtitle: "Instant relief when cravings hit hard.",
        description: "Whenever an urge strikes, tap the Urge Quest SOS button for guided 4D breathing, distraction games, and fast craving relief.",
        highlights: [
          "🚨 1-Tap SOS Button accessible anywhere",
          "🫁 4D Box Breathing animation to calm urge",
          "🧩 Fun mini-quests to redirect focus"
        ],
        accentBg: "from-rose-600 via-red-600 to-rose-800",
        emoji: "🚨",
      },
      {
        title: "Private & Safe 🔒",
        subtitle: "Your personal data remains 100% confidential.",
        description: "Bloom runs locally with full privacy. Track your progress with complete peace of mind and customize themes anytime.",
        highlights: [
          "🔐 Local storage data protection",
          "🌐 Multi-language support (English, Malay, Chinese, Korean)",
          "🎨 Personalize themes & avatars anytime"
        ],
        accentBg: "from-emerald-700 via-teal-700 to-emerald-900",
        emoji: "🔒",
      }
    ],
    ms: [
      {
        title: "Selamat Datang ke Bloom 🌸",
        subtitle: "Perjalanan anda ke arah kehidupan bebas rokok bermula di sini.",
        description: "Bloom direka untuk membimbing perubahan tabiat anda secara lembut melalui pendaftaran harian dan tumbuhan digital.",
        highlights: [
          "💧 Daftar masuk menyiram tumbuhan & rekod",
          "🛡️ Dapatkan Perisai untuk melindung rekod",
          "🏆 Tumbuh dari Benih 🌱 ke Bloom 🌸"
        ],
        accentBg: "from-emerald-600 via-teal-600 to-emerald-800",
        isLangPicker: true,
        emoji: "🌸",
      },
      {
        title: "Daftar Masuk Harian 📅",
        subtitle: "Membina momentum satu hari demi satu hari.",
        description: "Catat status anda setiap hari dalam beberapa saat. Pilih sama ada anda bebas merokok atau catat rekod tanpa sebarang penilaian.",
        highlights: [
          "✨ Kekalkan rekod anda aktif tanpa tekanan",
          "📝 Jurnal pilihan untuk merefleksikan perasaan",
          "🪙 Dapatkan syiling & XP setiap daftar masuk"
        ],
        accentBg: "from-teal-600 via-emerald-600 to-teal-800",
        emoji: "📅",
      },
      {
        title: "Tumbuhan Digital Anda 🌱",
        subtitle: "Lihat usaha anda berkembang menjadi kenyataan.",
        description: "Tumbuhan anda membesar berdasarkan komitmen anda. Rekod yang lebih tinggi membuka tahap pertumbuhan & ganjaran baharu.",
        highlights: [
          "🎋 Perkembangan tumbuhan mencerminkan rekod anda",
          "🪴 Pilih daripada Bonsai, Buluh, Lavender & Bunga Matahari",
          "🌟 Selesaikan misi untuk dapatkan baja & perisai"
        ],
        accentBg: "from-emerald-600 via-green-600 to-emerald-800",
        emoji: plantEmoji,
      },
      {
        title: "Kecemasan Hasrat SOS 🚨",
        subtitle: "Bantuan segera apabila ketagihan melanda.",
        description: "Setiap kali dorongan merokok datang, tekan butang SOS Misi Hasrat untuk latihan pernafasan 4D dan permainan alih tumpuan.",
        highlights: [
          "🚨 Butang SOS 1-Sentuhan boleh diakses bila-bila masa",
          "🫁 Pernafasan 4D untuk menenangkan dorongan",
          "🧩 Misi mini menyeronokkan untuk mengalih fokus"
        ],
        accentBg: "from-rose-600 via-red-600 to-rose-800",
        emoji: "🚨",
      },
      {
        title: "Sulit & Selamat 🔒",
        subtitle: "Data peribadi anda kekal 100% milik anda.",
        description: "Bloom berjalan secara tempatan dengan kerahsiaan penuh. Jejak kemajuan anda dengan ketenangan fikiran sepenuhnya.",
        highlights: [
          "🔐 Perlindungan data simpanan tempatan",
          "🌐 Sokongan pelbagai bahasa",
          "🎨 Sesuaikan tema & avatar bila-bila masa"
        ],
        accentBg: "from-emerald-700 via-teal-700 to-emerald-900",
        emoji: "🔒",
      }
    ],
    zh: [
      {
        title: "欢迎来到 Bloom 🌸",
        subtitle: "开启无烟健康生活的温馨起点。",
        description: "Bloom 旨在通过温馨的每日打卡、习惯追踪与数字植物培育，陪伴您逐步戒除烟瘾。",
        highlights: [
          "💧 每日打卡浇水，积累连胜天数",
          "🛡️ 赢取保护盾牌，守护连胜记录",
          "🏆 从幼苗 🌱 升级为大师级 Bloom 🌸"
        ],
        accentBg: "from-emerald-600 via-teal-600 to-emerald-800",
        isLangPicker: true,
        emoji: "🌸",
      },
      {
        title: "每日打卡 📅",
        subtitle: "积少成多，见证每日改变。",
        description: "几秒钟即可轻松完成每日打卡。选择今日是否保持无烟，记录真实的自我。",
        highlights: [
          "✨ 无压力保持打卡连胜状态",
          "📝 随心记录心情随笔与戒烟日记",
          "🪙 每次打卡均可获得金币与经验值"
        ],
        accentBg: "from-teal-600 via-emerald-600 to-teal-800",
        emoji: "📅",
      },
      {
        title: "您的专属数字植物 🌱",
        subtitle: "倾注汗水，静待花开。",
        description: "您的植物因坚持而茁壮。保持打卡将解锁不同的生长阶段、稀有外观与特色植物。",
        highlights: [
          "🎋 植物生长形象展示您的打卡连胜",
          "🪴 可选罗汉松、高洁竹、薰衣草与向日葵",
          "🌟 完成健康任务获取有机肥料与保护盾"
        ],
        accentBg: "from-emerald-600 via-green-600 to-emerald-800",
        emoji: plantEmoji,
      },
      {
        title: "烟瘾克制 SOS 🚨",
        subtitle: "烟瘾来袭时的即时心理救助。",
        description: "每当渴望产生时，点击 SOS 按钮即可开启 4D 专项箱式呼吸训练与趣味分散注意力练习。",
        highlights: [
          "🚨 一键紧急 SOS 悬浮按钮",
          "🫁 4D 动画引导箱式深呼吸平静身心",
          "🧩 趣味解压小游戏快速转移注意力"
        ],
        accentBg: "from-rose-600 via-red-600 to-rose-800",
        emoji: "🚨",
      },
      {
        title: "隐私安全 🔒",
        subtitle: "您的数据 100% 属于您自己。",
        description: "Bloom 完全本地化运行，全程保障个人隐私。放心记录您的无烟旅途。",
        highlights: [
          "🔐 本地安全存储隐私保障",
          "🌐 支持多国语言无缝切换",
          "🎨 随时自定义个性主题与头像"
        ],
        accentBg: "from-emerald-700 via-teal-700 to-emerald-900",
        emoji: "🔒",
      }
    ],
    ko: [
      {
        title: "블룸에 오신 것을 환영합니다 🌸",
        subtitle: "담배 없는 더 건강한 삶을 향한 여정이 시작됩니다.",
        description: "Bloom은 부드러운 일일 출석 체크, 습관 기록 및 디지털 식물 성장을 통해 변화를 돕습니다.",
        highlights: [
          "💧 출석 체크로 식물과 연속 기록 키우기",
          "🛡️ 방어 쉴드로 연속 기록 보호",
          "🏆 새싹 🌱 에서 마스터 Bloom 🌸 으로 성장"
        ],
        accentBg: "from-emerald-600 via-teal-600 to-emerald-800",
        isLangPicker: true,
        emoji: "🌸",
      },
      {
        title: "일일 출석 체크 📅",
        subtitle: "매일 매일 쌓여가는 성취감.",
        description: "몇 초 만에 일일 출석을 완료하세요. 압박감 없이 솔직하게 기록할 수 있습니다.",
        highlights: [
          "✨ 부담 없이 유지하는 연속 달성 기록",
          "📝 솔직한 감정을 적는 마음 일기",
          "🪙 출석마다 경험치와 코인 획득"
        ],
        accentBg: "from-teal-600 via-emerald-600 to-teal-800",
        emoji: "📅",
      },
      {
        title: "나만의 디지털 식물 🌱",
        subtitle: "금연 노력이 아름다운 결실로 맺어집니다.",
        description: "꾸준한 출석에 맞춰 식물이 차근차근 자라납니다. 높은 연속 기록으로 희귀 식물을 해금하세요.",
        highlights: [
          "🎋 연속 기록에 따라 성장하는 식물 모습",
          "🪴 분재, 대나무, 라벤더, 해바라기 등 선택",
          "🌟 퀘스트 달성으로 비료와 방어막 획득"
        ],
        accentBg: "from-emerald-600 via-green-600 to-emerald-800",
        emoji: plantEmoji,
      },
      {
        title: "흡연 욕구 SOS 🚨",
        subtitle: "갑작스러운 흡연 욕구를 위한 즉시 완화.",
        description: "흡연 욕구가 생기면 SOS 버튼을 눌러 4D 호흡 운동과 전환 미션을 시작하세요.",
        highlights: [
          "🚨 언제나 이용 가능한 1-터치 SOS 버튼",
          "🫁 욕구를 진정시키는 4D 박스 호흡법",
          "🧩 주의를 환기하는 재미있는 미니 게임"
        ],
        accentBg: "from-rose-600 via-red-600 to-rose-800",
        emoji: "🚨",
      },
      {
        title: "개인정보 보호 🔒",
        subtitle: "귀하의 소중한 기록은 100% 안전합니다.",
        description: "Bloom은 기기 내 로컬에 데이터를 안전하게 저장하며 완전한 기밀성을 보장합니다.",
        highlights: [
          "🔐 로컬 저장소 보안 보호",
          "🌐 다국어 지원 (영어, 말레이어, 중국어, 한국어)",
          "🎨 언제든지 테마와 프로필 변경 가능"
        ],
        accentBg: "from-emerald-700 via-teal-700 to-emerald-900",
        emoji: "🔒",
      }
    ]
  };

  const slides = slidesByLanguage[language] || slidesByLanguage.en;
  const currentSlide = slides[step] || slides[0];
  const isLast = step === slides.length - 1;

  const navLabels = {
    en: { prev: "Back", next: "Next Step", start: "Get Started! 🌱", skip: "Skip" },
    ms: { prev: "Kembali", next: "Seterusnya", start: "Mula Sekarang! 🌱", skip: "Langkah" },
    zh: { prev: "上一步", next: "下一步", start: "开启无烟之旅！🌱", skip: "跳过" },
    ko: { prev: "이전", next: "다음 단계", start: "시작하기! 🌱", skip: "건너뛰기" },
  }[language] || { prev: "Back", next: "Next Step", start: "Get Started! 🌱", skip: "Skip" };

  return (
    <>
      {/* Main Tour Modal Overlay */}
      {activeIsOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-emerald-950/75 backdrop-blur-md animate-fade-in select-none overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100 flex flex-col relative max-h-[90vh] my-auto">
            
            {/* Top Banner with Dynamic Accent Gradient */}
            <div className={`p-6 sm:p-8 bg-gradient-to-br ${currentSlide.accentBg} text-white relative flex flex-col items-center text-center transition-all duration-500`}>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/15 hover:bg-black/25 p-2 rounded-full cursor-pointer transition-all border-none"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-[10px] font-mono font-black uppercase tracking-widest bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full mb-3 text-white border border-white/20">
                {step + 1} / {slides.length}
              </span>

              <motion.div
                key={`emoji-${step}`}
                initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg mb-3 border border-white/30"
              >
                {currentSlide.emoji}
              </motion.div>

              <motion.h3
                key={`title-${step}`}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-serif font-black tracking-tight drop-shadow-xs"
              >
                {currentSlide.title}
              </motion.h3>

              <p className="text-xs text-white/90 font-medium mt-1 max-w-xs leading-snug">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-7 space-y-4 overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`body-${step}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                    {currentSlide.description}
                  </p>

                  {/* Interactive Language Selector on Step 1 */}
                  {currentSlide.isLangPicker && onLanguageSelect && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Select Preferred Language</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { code: "en" as Language, label: "English 🇬🇧" },
                          { code: "ms" as Language, label: "Bahasa Melayu 🇲🇾" },
                          { code: "zh" as Language, label: "中文 🇨🇳" },
                          { code: "ko" as Language, label: "한국어 🇰🇷" },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => onLanguageSelect(lang.code)}
                            className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-left flex items-center justify-between ${
                              language === lang.code
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50 hover:border-emerald-300"
                            }`}
                          >
                            <span>{lang.label}</span>
                            {language === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature Highlights List */}
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-2">
                    {currentSlide.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-emerald-950">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress Dots Indicator */}
              <div className="flex justify-center items-center gap-2 pt-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === step ? "w-8 bg-emerald-600" : "w-2 bg-stone-200 hover:bg-stone-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Modal Footer Navigation Controls */}
            <div className="p-4 sm:px-7 bg-stone-50/90 border-t border-stone-100 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button
                  onClick={() => setStep((prev) => prev - 1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 cursor-pointer transition-all flex items-center gap-1 border-none shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{navLabels.prev}</span>
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="text-xs text-stone-400 hover:text-stone-600 font-bold cursor-pointer bg-transparent border-none px-2"
                >
                  {navLabels.skip}
                </button>
              )}

              {isLast ? (
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 ml-auto border-none"
                >
                  <Flower2 className="w-4 h-4" />
                  <span>{navLabels.start}</span>
                </button>
              ) : (
                <button
                  onClick={() => setStep((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 ml-auto border-none"
                >
                  <span>{navLabels.next}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
