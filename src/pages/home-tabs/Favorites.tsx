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
    IonActionSheet,
    IonSearchbar,
    IonGrid,
    IonRow,
    IonCol,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    createAnimation,
    IonBadge
  } from '@ionic/react';
import { person, document, heart, heartOutline, bookmark, bookmarkOutline, refreshCircle, share, filter, timeOutline, gridOutline, listOutline, searchOutline, trashOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
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
  };
}

interface FavoriteUserResponse {
  favorite_user_id: string;
  users: {
    username: string;
    user_avatar_url: string;
  };
  created_at: string;
}

type SortOption = 'newest' | 'oldest' | 'most_reactions';

interface ViewOptions {
  layout: 'grid' | 'list';
  searchText: string;
}

const ITEMS_PER_PAGE = 10;
  
  const Favorites: React.FC = () => {
  const [viewType, setViewType] = useState<'posts' | 'users'>('posts');
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<FavoriteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [presentToast] = useIonToast();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    layout: 'list',
    searchText: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const cardRefs = useRef<(HTMLIonCardElement | null)[]>([]);

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
          .eq('user_id', user.id) as { data: SavedPostResponse[] | null; error: any };

        if (postsError) throw postsError;
        if (!savedPostsData) return;

        const posts = savedPostsData.map(item => ({
          post_id: item.post_id,
          user_id: item.posts.user_id,
          username: item.posts.username,
          avatar_url: item.posts.avatar_url,
          post_content: item.posts.post_content,
          image_url: item.posts.image_url,
          post_created_at: item.posts.post_created_at,
          reaction_count: item.posts.reaction_count
        }));

        const sortedPosts = sortPosts(posts);
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
          .eq('user_id', user.id) as { data: FavoriteUserResponse[] | null; error: any };

        if (usersError) throw usersError;
        if (!favUsersData) return;

        setFavoriteUsers(favUsersData.map(item => ({
          favorite_user_id: item.favorite_user_id,
          username: item.users.username,
          user_avatar_url: item.users.user_avatar_url,
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

  const sortPosts = (posts: SavedPost[]) => {
    return [...posts].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.post_created_at).getTime() - new Date(a.post_created_at).getTime();
        case 'oldest':
          return new Date(a.post_created_at).getTime() - new Date(b.post_created_at).getTime();
        case 'most_reactions':
          return b.reaction_count - a.reaction_count;
        default:
          return 0;
      }
    });
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

  const loadMore = async (event: CustomEvent<void>) => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    if (viewType === 'posts') {
      const nextItems = savedPosts.slice(start, end);
      if (nextItems.length > 0) {
        setSavedPosts(current => [...current, ...nextItems]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } else {
      const nextItems = favoriteUsers.slice(start, end);
      if (nextItems.length > 0) {
        setFavoriteUsers(current => [...current, ...nextItems]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    }

    if (event.target && 'complete' in event.target) {
      (event.target as any).complete();
    }
  };

  const handleSearch = (text: string) => {
    setViewOptions(prev => ({ ...prev, searchText: text }));
    setPage(1);
    setHasMore(true);
  };

  const getFilteredItems = () => {
    const searchText = viewOptions.searchText.toLowerCase();
    if (viewType === 'posts') {
      return savedPosts.filter(post => 
        post.username.toLowerCase().includes(searchText) ||
        post.post_content.toLowerCase().includes(searchText)
      );
    } else {
      return favoriteUsers.filter(user =>
        user.username.toLowerCase().includes(searchText)
      );
    }
  };

  const animateCard = (card: HTMLIonCardElement) => {
    const animation = createAnimation()
      .addElement(card)
      .duration(300)
      .fromTo('opacity', '0', '1')
      .fromTo('transform', 'translateY(20px)', 'translateY(0)');
    
    animation.play();
  };

  useEffect(() => {
    cardRefs.current.forEach((card) => {
      if (card) {
        animateCard(card);
      }
    });
  }, [savedPosts, favoriteUsers]);

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
            </IonButtons>
            <IonTitle>Favorites</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setViewOptions(prev => ({
              ...prev,
              layout: prev.layout === 'grid' ? 'list' : 'grid'
            }))}>
              <IonIcon icon={viewOptions.layout === 'grid' ? listOutline : gridOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={viewOptions.searchText}
            onIonInput={e => handleSearch(e.detail.value || '')}
            placeholder="Search..."
            animated={true}
          />
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={viewType} onIonChange={e => setViewType(e.detail.value as 'posts' | 'users')}>
            <IonSegmentButton value="posts">
              <IonIcon icon={bookmark} />
              <IonLabel>Saved Posts</IonLabel>
              <IonBadge>{savedPosts.length}</IonBadge>
            </IonSegmentButton>
            <IonSegmentButton value="users">
              <IonIcon icon={person} />
              <IonLabel>Favorite Users</IonLabel>
              <IonBadge>{favoriteUsers.length}</IonBadge>
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

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshCircle}
            refreshingSpinner="circles"
          />
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
          getFilteredItems().length > 0 ? (
            viewOptions.layout === 'grid' ? (
              <IonGrid>
                <IonRow>
                  {(getFilteredItems() as SavedPost[]).map((post, index) => (
                    <IonCol size="12" sizeMd="6" sizeLg="4" key={post.post_id}>
                      <IonCard ref={el => cardRefs.current[index] = el}>
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
                            <div>
                              <IonButton fill="clear" size="small" onClick={() => handleShare(post)}>
                                <IonIcon slot="icon-only" icon={share} />
                              </IonButton>
                              <IonButton fill="clear" size="small" onClick={() => removeSavedPost(post.post_id)}>
                                <IonIcon slot="icon-only" icon={bookmarkOutline} />
                              </IonButton>
                            </div>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            ) : (
              <IonList>
                {(getFilteredItems() as SavedPost[]).map((post, index) => (
                  <IonItemSliding key={post.post_id}>
                    <IonItem>
                      <IonAvatar slot="start">
                        <img src={post.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={post.username} />
                      </IonAvatar>
                      <IonLabel>
                        <h2>{post.username}</h2>
                        <p>{post.post_content}</p>
                        <p>
                          <IonIcon icon={timeOutline} style={{ marginRight: '5px' }} />
                          {formatDate(post.post_created_at)}
                        </p>
                      </IonLabel>
                      <IonButton fill="clear" slot="end">
                        <IonIcon slot="icon-only" icon={heartOutline} />
                        {post.reaction_count}
                      </IonButton>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption onClick={() => handleShare(post)}>
                        <IonIcon slot="icon-only" icon={share} />
                      </IonItemOption>
                      <IonItemOption color="danger" onClick={() => removeSavedPost(post.post_id)}>
                        <IonIcon slot="icon-only" icon={trashOutline} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            )
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
              {(getFilteredItems() as FavoriteUser[]).map(user => (
                <IonItemSliding key={user.favorite_user_id}>
                  <IonItem>
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
                  <IonItemOptions side="end">
                    <IonItemOption color="danger" onClick={() => removeFavoriteUser(user.favorite_user_id)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
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

        <IonInfiniteScroll
          onIonInfinite={loadMore}
          threshold="100px"
          disabled={!hasMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more..."
          />
        </IonInfiniteScroll>

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