export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI 音乐制作",
      description:
        "使用Suno.ai和Udio.com的服务制作高质量的音乐作品，并且提供生成歌词的功能",
      image: "/images/global/desc_zh.jpeg",
    },
    en: {
      title: "AI Music Production",
      description:
        "Use the services of Suno.ai and Udio.com to create high-quality music and generate lyrics",
      image: "/images/global/desc_en.jpeg",
    },
    ja: {
      title: "AI音楽制作",
      description:
        "Suno.aiとUdio.comのサービスを使用して、高品質の音楽作品を制作し、歌詞を生成します",
      image: "/images/global/desc_ja.jpeg",
    },
  },
};
