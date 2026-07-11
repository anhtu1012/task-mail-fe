const defaultMetadata = {
  author: "CEH",
  headerTitle: "Task",
  language: "vi-ve",
  theme: "system",
  locale: "vi-ve",
};

const siteMetadata = ({
  title,
  description,
  author = defaultMetadata.author,
  headerTitle = defaultMetadata.headerTitle,
  language = defaultMetadata.language,
  theme = defaultMetadata.theme,
  locale = defaultMetadata.locale,
}: {
  title: string;
  description: string;
  author?: string;
  headerTitle?: string;
  language?: string;
  theme?: string;
  locale?: string;
}) => {
  const content = {
    title,
    author,
    headerTitle,
    description,
    language,
    theme,
    locale,
  };

  const metadata = {
    title: {
      template: `%s | ${content.title}`,
      default: content.title,
    },
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      siteName: content.title,
      locale: content.locale,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };

  return { content, metadata };
};

export default siteMetadata;
