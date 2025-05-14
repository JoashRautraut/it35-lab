import { 
    IonButtons,
    IonContent, 
    IonHeader, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
    IonToolbar,
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
    IonRefresher,
    IonRefresherContent,
    useIonToast,
    IonList,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton,
    IonActionSheet
} from '@ionic/react';
import { person, document, heart, heartOutline, bookmark, bookmarkOutline, refreshCircle, share, filter, timeOutline } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClients';

interface SavedPost {
  post_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  post_content: string;
  image_url?: string;
  post_created_at: string;
  reaction_count: number;
}

interface FavoriteUser {
  favorite_user_id: string;
  username: string;
  user_avatar_url: string;
  created_at: string;
}

type SortOption = 'newest' | 'oldest' | 'most_reactions';

interface SavedPostResponse {
  post_id: string;
  posts: {
    user_id: string;
    username: string;
    avatar_url: string;
    post_content: string;
    image_url?: string;
    post_created_at: string;
    reaction_count: number;
  }
}

interface FavoriteUserResponse {
  favorite_user_id: string;
  users: {
    username: string;
    user_avatar_url: string;
  };
  created_at: string;
}

const Favorites: React.FC = () => {
  const [viewType, setViewType] = useState<'posts' | 'users'>('posts');
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<FavoriteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [presentToast] = useIonToast();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);

  const fetchSavedItems = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (viewType === 'posts') {
        const { data: savedPostsData, error: postsError } = await supabase
          .from('saved_posts')
          .select(`
            post_id,
            posts (
              user_id,
              username,
              avatar_url,
              post_content,
              image_url,
              post_created_at,
              reaction_count
            )
          `)
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false }) as { 
            data: SavedPostResponse[] | null;
            error: any;
          };

        if (postsError) throw postsError;
        if (!savedPostsData) return;

        const posts = savedPostsData.map(item => ({
          post_id: item.post_id,
          user_id: item.posts?.user_id || '',
          username: item.posts?.username || '',
          avatar_url: item.posts?.avatar_url || '',
          post_content: item.posts?.post_content || '',
          image_url: item.posts?.image_url,
          post_created_at: item.posts?.post_created_at || new Date().toISOString(),
          reaction_count: item.posts?.reaction_count || 0
        }));

        // Apply sorting
        const sortedPosts = sortPosts(posts, sortBy);
        setSavedPosts(sortedPosts);
      } else {
        const { data: favUsersData, error: usersError } = await supabase
          .from('favorite_users')
          .select(`
            favorite_user_id,
            users (
              username,
              user_avatar_url
            ),
            created_at
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) as {
            data: FavoriteUserResponse[] | null;
            error: any;
          };

        if (usersError) throw usersError;
        if (!favUsersData) return;

        setFavoriteUsers(favUsersData.map(item => ({
          favorite_user_id: item.favorite_user_id,
          username: item.users?.username || '',
          user_avatar_url: item.users?.user_avatar_url || '',
          created_at: item.created_at
        })));
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
      presentToast({
        message: 'Error loading saved items',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems();
  }, [viewType, sortBy]);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchSavedItems();
    event.detail.complete();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const sortPosts = (posts: SavedPost[], sortOption: SortOption) => {
    switch (sortOption) {
      case 'newest':
        return [...posts].sort((a, b) => 
          new Date(b.post_created_at).getTime() - new Date(a.post_created_at).getTime()
        );
      case 'oldest':
        return [...posts].sort((a, b) => 
          new Date(a.post_created_at).getTime() - new Date(b.post_created_at).getTime()
        );
      case 'most_reactions':
        return [...posts].sort((a, b) => b.reaction_count - a.reaction_count);
      default:
        return posts;
    }
  };

  const handleShare = async (post: SavedPost) => {
    setSelectedPost(post);
    setShowActionSheet(true);
  };

  const removeSavedPost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .match({ user_id: user.id, post_id: postId });

      if (error) throw error;

      setSavedPosts(current => current.filter(post => post.post_id !== postId));
      presentToast({
        message: 'Post removed from saved items',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error removing saved post:', error);
      presentToast({
        message: 'Error removing post',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const removeFavoriteUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('favorite_users')
        .delete()
        .match({ user_id: user.id, favorite_user_id: userId });

      if (error) throw error;

      setFavoriteUsers(current => current.filter(favUser => favUser.favorite_user_id !== userId));
      presentToast({
        message: 'User removed from favorites',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error removing favorite user:', error);
      presentToast({
        message: 'Error removing user from favorites',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Favorites</IonTitle>
          {viewType === 'posts' && (
            <IonButtons slot="end">
              <IonButton>
                <IonIcon slot="icon-only" icon={filter} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={viewType} onIonChange={e => setViewType(e.detail.value as 'posts' | 'users')}>
            <IonSegmentButton value="posts">
              <IonIcon icon={bookmark} />
              <IonLabel>Saved Posts</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="users">
              <IonIcon icon={person} />
              <IonLabel>Favorite Users</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
        {viewType === 'posts' && (
          <IonToolbar>
            <IonSelect
              value={sortBy}
              onIonChange={e => setSortBy(e.detail.value)}
              interface="popover"
              placeholder="Sort by"
            >
              <IonSelectOption value="newest">Newest First</IonSelectOption>
              <IonSelectOption value="oldest">Oldest First</IonSelectOption>
              <IonSelectOption value="most_reactions">Most Reactions</IonSelectOption>
            </IonSelect>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshCircle}
            refreshingSpinner="circles"
          ></IonRefresherContent>
        </IonRefresher>

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
        ) : viewType === 'posts' ? (
          savedPosts.length > 0 ? (
            savedPosts.map(post => (
              <IonCard key={post.post_id}>
                <IonItem lines="none">
                  <IonAvatar slot="start">
                    <img src={post.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={post.username} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{post.username}</h2>
                    <p>
                      <IonIcon icon={timeOutline} style={{ marginRight: '5px' }} />
                      {formatDate(post.post_created_at)}
                    </p>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => removeSavedPost(post.post_id)}
                  >
                    <IonIcon slot="icon-only" icon={bookmarkOutline} />
                  </IonButton>
                </IonItem>
                <IonCardContent>
                  <IonText>{post.post_content}</IonText>
                  {post.image_url && (
                    <div style={{ marginTop: '1rem' }}>
                      <IonImg src={post.image_url} />
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginTop: '1rem'
                  }}>
                    <IonButton fill="clear" size="small">
                      <IonIcon slot="start" icon={heartOutline} />
                      {post.reaction_count}
                    </IonButton>
                    <IonButton fill="clear" size="small" onClick={() => handleShare(post)}>
                      <IonIcon slot="icon-only" icon={share} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <IonIcon
                icon={bookmark}
                style={{
                  fontSize: '48px',
                  color: 'var(--ion-color-medium)',
                  marginBottom: '1rem'
                }}
              />
              <IonText color="medium">
                <h2>No Saved Posts</h2>
                <p>Posts you save will appear here</p>
              </IonText>
            </div>
          )
        ) : (
          favoriteUsers.length > 0 ? (
            <IonList>
              {favoriteUsers.map(user => (
                <IonItem key={user.favorite_user_id}>
                  <IonAvatar slot="start">
                    <img src={user.user_avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={user.username} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{user.username}</h2>
                    <p>
                      <IonIcon icon={timeOutline} style={{ marginRight: '5px' }} />
                      Favorited on {formatDate(user.created_at)}
                    </p>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => removeFavoriteUser(user.favorite_user_id)}
                  >
                    <IonIcon slot="icon-only" icon={heartOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <IonIcon
                icon={heart}
                style={{
                  fontSize: '48px',
                  color: 'var(--ion-color-medium)',
                  marginBottom: '1rem'
                }}
              />
              <IonText color="medium">
                <h2>No Favorite Users</h2>
                <p>Users you favorite will appear here</p>
              </IonText>
            </div>
          )
        )}

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Share via...',
              icon: share,
              handler: () => {
                if (selectedPost) {
                  navigator.share({
                    title: `Post by ${selectedPost.username}`,
                    text: selectedPost.post_content,
                    url: window.location.origin + `/post/${selectedPost.post_id}`
                  }).catch(console.error);
                }
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Favorites;