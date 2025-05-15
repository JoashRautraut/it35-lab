import { useState, useEffect } from 'react';
import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonSearchbar, 
  IonTitle, 
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonText,
  IonChip,
  IonIcon,
  IonBadge,
  useIonToast
} from '@ionic/react';
import { 
  person, 
  document, 
  time, 
  search as searchIcon,
  heart,
  chatbubble,
  image as imageIcon
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClients';

interface SearchResult {
  type: 'post' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  avatar_url?: string;
  content?: string;
  created_at?: string;
  image_url?: string;
  reaction_count?: number;
  comment_count?: number;
}

const Search: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'posts' | 'users'>('posts');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [presentToast] = useIonToast();

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const saveSearch = (term: string) => {
    if (term.trim()) {
      const updatedSearches = [
        term,
        ...recentSearches.filter(s => s !== term).slice(0, 4)
      ];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
  };

  const searchPosts = async (term: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          post_id,
          username,
          avatar_url,
          post_content,
          post_created_at,
          image_url,
          comments (count),
          reactions (count)
        `)
        .or(`post_content.ilike.%${term}%,username.ilike.%${term}%`)
        .order('post_created_at', { ascending: false });

      if (error) throw error;

      return data.map(post => ({
        type: 'post' as const,
        id: post.post_id,
        title: post.username,
        avatar_url: post.avatar_url,
        content: post.post_content,
        created_at: post.post_created_at,
        image_url: post.image_url,
        reaction_count: post.reactions.length,
        comment_count: post.comments.length
      }));
    } catch (error) {
      console.error('Error searching posts:', error);
      presentToast({
        message: 'Error searching posts. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      return [];
    }
  };

  const searchUsers = async (term: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, user_firstname, user_lastname, user_avatar_url')
        .or(`username.ilike.%${term}%,user_firstname.ilike.%${term}%,user_lastname.ilike.%${term}%`);

      if (error) throw error;

      return data.map(user => ({
        type: 'user' as const,
        id: user.user_id,
        title: user.username,
        subtitle: `${user.user_firstname} ${user.user_lastname}`,
        avatar_url: user.user_avatar_url
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      presentToast({
        message: 'Error searching users. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      return [];
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = searchType === 'posts' 
        ? await searchPosts(term)
        : await searchUsers(term);
      setResults(searchResults);
      saveSearch(term);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={e => setSearchText(e.detail.value!)}
            onIonChange={e => handleSearch(e.detail.value!)}
            placeholder="Search posts and users"
            debounce={300}
            animated={true}
          />
          <IonSegment value={searchType} onIonChange={e => setSearchType(e.detail.value as 'posts' | 'users')}>
            <IonSegmentButton value="posts">
              <IonLabel>Posts</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="users">
              <IonLabel>Users</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {isLoading ? (
          // Loading skeleton
          <IonList>
            {[...Array(3)].map((_, i) => (
              <IonItem key={i}>
                <IonAvatar slot="start">
                  <IonSkeletonText animated />
                </IonAvatar>
                <IonLabel>
                  <IonSkeletonText animated style={{ width: '70%' }} />
                  <IonSkeletonText animated style={{ width: '40%' }} />
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : searchText ? (
          // Search Results
          <div>
            {results.length > 0 ? (
              <IonList>
                {results.map(result => (
                  result.type === 'post' ? (
                    <IonCard key={result.id}>
                      <IonCardHeader>
                        <IonItem lines="none">
                          <IonAvatar slot="start">
                            <img src={result.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={result.title} />
                          </IonAvatar>
                          <IonLabel>
                            <h2>{result.title}</h2>
                            <p>{formatDate(result.created_at!)}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCardHeader>
                      <IonCardContent>
                        <IonText>{result.content}</IonText>
                        {result.image_url && (
                          <div style={{ marginTop: '8px' }}>
                            <img 
                              src={result.image_url} 
                              alt="Post" 
                              style={{ 
                                width: '100%', 
                                maxHeight: '200px', 
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }} 
                            />
                          </div>
                        )}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <IonChip>
                            <IonIcon icon={heart} />
                            <IonLabel>{result.reaction_count}</IonLabel>
                          </IonChip>
                          <IonChip>
                            <IonIcon icon={chatbubble} />
                            <IonLabel>{result.comment_count}</IonLabel>
                          </IonChip>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ) : (
                    <IonItem key={result.id} button>
                      <IonAvatar slot="start">
                        <img src={result.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={result.title} />
                      </IonAvatar>
                      <IonLabel>
                        <h2>{result.title}</h2>
                        {result.subtitle && <p>{result.subtitle}</p>}
                      </IonLabel>
                    </IonItem>
                  )
                ))}
              </IonList>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px',
                flexDirection: 'column',
                color: 'var(--ion-color-medium)'
              }}>
                <IonIcon 
                  icon={searchIcon} 
                  style={{ 
                    fontSize: '48px', 
                    marginBottom: '16px' 
                  }} 
                />
                <IonText>No results found</IonText>
              </div>
            )}
          </div>
        ) : (
          // Recent Searches
          <div>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h2 style={{ fontWeight: 'bold' }}>Recent Searches</h2>
                </IonLabel>
              </IonItem>
              {recentSearches.map((search, index) => (
                <IonItem key={index} button onClick={() => {
                  setSearchText(search);
                  handleSearch(search);
                }}>
                  <IonIcon icon={time} slot="start" />
                  <IonLabel>{search}</IonLabel>
                </IonItem>
              ))}
              {recentSearches.length === 0 && (
                <IonItem>
                  <IonLabel color="medium">No recent searches</IonLabel>
                </IonItem>
              )}
            </IonList>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Search;