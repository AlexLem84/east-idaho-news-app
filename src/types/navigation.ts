import { WordPressPost } from '../services/wordpressService';

export type RootStackParamList = {
  Home: undefined;
  ArticleDetail: {
    article: WordPressPost;
    category: string;
  };
  Archive: undefined;
};
