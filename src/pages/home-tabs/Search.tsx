import { 
    IonButtons,
    IonContent, 
    IonHeader, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
    IonToolbar,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonAvatar,
    IonItem,
    IonLabel,
    IonText,
    IonSkeletonText,
    IonImg,
    IonButton,
    IonIcon,
    IonChip,
    useIonToast
} from '@ionic/react';
import { person, document, heart, heartOutline, time } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClients';

interface SearchResult {
  type: 'user' | 'post';
  id: string;
  username?: string;
  avatar_url?: string;
  post_content?: string;
  post_created_at?: string;
  image_url?: string;
  reaction_count?: number;
}

const Search: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'posts'>('posts');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [presentToast] = useIonToast();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async (searchTerm: string = searchText) => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      if (searchType === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('user_id, username, user_avatar_url')
          .ilike('username', `%${searchTerm}%`)
          .limit(10);

        if (error) throw error;

        setResults(data.map(user => ({
          type: 'user',
          id: user.user_id,
          username: user.username,
          avatar_url: user.user_avatar_url
        })));
      } else {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .or(`post_content.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
          .order('post_created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        setResults(data.map(post => ({
          type: 'post',
          id: post.post_id,
          username: post.username,
          post_content: post.post_content,
          post_created_at: post.post_created_at,
          image_url: post.image_url,
          reaction_count: post.reaction_count
        })));
      }

      saveRecentSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
      presentToast({
        message: 'Error performing search',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || '')}
            onIonChange={() => handleSearch()}
            placeholder="Search posts and users..."
            animated={true}
            debounce={500}
          />
          <IonSegment value={searchType} onIonChange={e => setSearchType(e.detail.value as 'users' | 'posts')}>
            <IonSegmentButton value="posts">
              <IonIcon icon={document} />
              <IonLabel>Posts</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="users">
              <IonIcon icon={person} />
              <IonLabel>Users</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {!searchText && recentSearches.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonLabel>Recent Searches</IonLabel>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {recentSearches.map((term, index) => (
                  <IonChip key={index} onClick={() => {
                    setSearchText(term);
                    handleSearch(term);
                  }}>
                    <IonIcon icon={time} />
                    <IonLabel>{term}</IonLabel>
                  </IonChip>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {isLoading ? (
          Array(3).fill(null).map((_, i) => (
            <IonCard key={i}>
              <IonItem lines="none">
                <IonAvatar slot="start">
                  <IonSkeletonText animated />
                </IonAvatar>
                <IonLabel>
                  <IonSkeletonText animated style={{ width: '50%' }} />
                </IonLabel>
              </IonItem>
              <IonCardContent>
                <IonSkeletonText animated style={{ width: '100%' }} />
                <IonSkeletonText animated style={{ width: '80%' }} />
              </IonCardContent>
            </IonCard>
          ))
        ) : (
          results.map(result => (
            <IonCard key={result.id}>
              {result.type === 'user' ? (
                <IonItem lines="none" button detail>
                  <IonAvatar slot="start">
                    <img src={result.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={result.username} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{result.username}</h2>
                  </IonLabel>
                </IonItem>
              ) : (
                <>
                  <IonItem lines="none">
                    <IonAvatar slot="start">
                      <img src={result.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={result.username} />
                    </IonAvatar>
                    <IonLabel>
                      <h2>{result.username}</h2>
                      <p>{formatDate(result.post_created_at!)}</p>
                    </IonLabel>
                  </IonItem>
                  <IonCardContent>
                    <IonText>{result.post_content}</IonText>
                    {result.image_url && (
                      <div style={{ marginTop: '1rem' }}>
                        <IonImg src={result.image_url} />
                      </div>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginTop: '1rem'
                    }}>
                      <IonButton fill="clear" size="small">
                        <IonIcon slot="start" icon={heartOutline} />
                        {result.reaction_count}
                      </IonButton>
                    </div>
                  </IonCardContent>
                </>
              )}
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default Search;