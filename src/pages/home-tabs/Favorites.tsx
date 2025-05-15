import { useState, useEffect } from 'react';
import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonText,
  IonChip,
  IonIcon,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  useIonToast,
  RefresherEventDetail,
  IonPopover,
  IonButton,
  IonModal,
  IonTextarea,
  IonAlert,
  IonFooter
} from '@ionic/react';
import { 
  heart, 
  chatbubble, 
  bookmark,
  bookmarkOutline,
  pencil,
  trash
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClients';

interface FavoritePost {
  post_id: string;
  username: string;
  avatar_url: string;
  post_content: string;
  post_created_at: string;
  image_url?: string;
  comments: { count: number }[];
  reactions: { count: number }[];
  user_id: number;
}

interface PostData {
  post_id: string;
  username: string;
  avatar_url: string;
  post_content: string;
  post_created_at: string;
  image_url?: string;
  comments: { count: number }[];
  reactions: { count: number }[];
}

interface FavoriteData {
  post_id: string;
  posts: PostData;
}

const Favorites: React.FC = () => {
  const [favoritePosts, setFavoritePosts] = useState<FavoritePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [presentToast] = useIonToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FavoritePost | null>(null);
  const [postContent, setPostContent] = useState('');
  const [popoverState, setPopoverState] = useState<{ open: boolean; event: Event | null; postId: string | null }>({ 
    open: false, 
    event: null, 
    postId: null 
  });

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites, error } = await supabase
        .from('favorites')
        .select(`
          post_id,
          posts (
            post_id,
            username,
            avatar_url,
            post_content,
            post_created_at,
            image_url,
            comments:comments(count),
            reactions:reactions(count)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as { data: FavoriteData[] | null; error: any };

      if (error) throw error;

      const posts = (favorites || [])
        .map(fav => {
          const post = fav.posts;
          if (!post) return null;
          return {
            post_id: post.post_id,
            username: post.username,
            avatar_url: post.avatar_url,
            post_content: post.post_content,
            post_created_at: post.post_created_at,
            image_url: post.image_url,
            comments: post.comments || [],
            reactions: post.reactions || [],
            user_id: Number(user.id)
          } as FavoritePost;
        })
        .filter((post): post is FavoritePost => post !== null);
      
      setFavoritePosts(posts);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      presentToast({
        message: 'Error loading favorites. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchFavorites();
    event.detail.complete();
  };

  const removeFavorite = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, post_id: postId });

      if (error) throw error;

      setFavoritePosts(posts => posts.filter(post => post.post_id !== postId));
      
      presentToast({
        message: 'Post removed from favorites',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      presentToast({
        message: 'Error removing favorite. Please try again.',
        duration: 2000,
        color: 'danger'
      });
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

  const startEditingPost = (post: FavoritePost) => {
    setEditingPost(post);
    setPostContent(post.post_content);
    setIsModalOpen(true);
  };

  const savePost = async () => {
    if (!postContent || !editingPost) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({ post_content: postContent })
        .eq('post_id', editingPost.post_id);

      if (error) throw error;

      setFavoritePosts(posts => 
        posts.map(post => 
          post.post_id === editingPost.post_id 
            ? { ...post, post_content: postContent }
            : post
        )
      );

      setPostContent('');
      setEditingPost(null);
      setIsModalOpen(false);
      setIsAlertOpen(true);
    } catch (error) {
      console.error('Error updating post:', error);
      presentToast({
        message: 'Error updating post. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('post_id', postId);

      if (error) throw error;

      setFavoritePosts(posts => posts.filter(post => post.post_id !== postId));
      presentToast({
        message: 'Post deleted successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      presentToast({
        message: 'Error deleting post. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {isLoading ? (
          <IonList>
            {[...Array(3)].map((_, i) => (
              <IonCard key={i}>
                <IonCardHeader>
                  <IonItem lines="none">
                    <IonAvatar slot="start">
                      <IonSkeletonText animated />
                    </IonAvatar>
                    <IonLabel>
                      <IonSkeletonText animated style={{ width: '70%' }} />
                      <IonSkeletonText animated style={{ width: '40%' }} />
                    </IonLabel>
                  </IonItem>
                </IonCardHeader>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '100%' }} />
                  <IonSkeletonText animated style={{ width: '100%' }} />
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        ) : favoritePosts.length > 0 ? (
          <IonList>
            {favoritePosts.map(post => (
              <IonCard key={post.post_id}>
                <IonCardHeader>
                  <IonItem lines="none">
                    <IonAvatar slot="start">
                      <img 
                        src={post.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
                        alt={post.username} 
                      />
                    </IonAvatar>
                    <IonLabel>
                      <h2>{post.username}</h2>
                      <p>{formatDate(post.post_created_at)}</p>
                    </IonLabel>
                    <IonButtons slot="end">
                      {post.user_id === Number((supabase.auth.getUser() as any)?.data?.user?.id) ? (
                        <>
                          <IonButton
                            fill="clear"
                            onClick={(e) => setPopoverState({
                              open: true,
                              event: e.nativeEvent,
                              postId: post.post_id
                            })}
                          >
                            <IonIcon icon={pencil} />
                          </IonButton>
                          <IonChip 
                            color="danger" 
                            onClick={() => removeFavorite(post.post_id)}
                          >
                            <IonIcon icon={bookmark} />
                            <IonLabel>Remove</IonLabel>
                          </IonChip>
                        </>
                      ) : (
                        <IonChip 
                          color="danger" 
                          onClick={() => removeFavorite(post.post_id)}
                        >
                          <IonIcon icon={bookmark} />
                          <IonLabel>Remove</IonLabel>
                        </IonChip>
                      )}
                    </IonButtons>
                  </IonItem>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>{post.post_content}</IonText>
                  
                  {post.image_url && (
                    <div style={{ marginTop: '8px' }}>
                      <img 
                        src={post.image_url} 
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
                      <IonLabel>{post.reactions?.length || 0}</IonLabel>
                    </IonChip>
                    <IonChip>
                      <IonIcon icon={chatbubble} />
                      <IonLabel>{post.comments?.length || 0}</IonLabel>
                    </IonChip>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            color: 'var(--ion-color-medium)'
          }}>
            <IonIcon 
              icon={bookmarkOutline} 
              style={{ 
                fontSize: '48px', 
                marginBottom: '16px' 
              }} 
            />
            <IonText>No favorite posts yet</IonText>
          </div>
        )}

        <IonPopover
          isOpen={popoverState.open}
          event={popoverState.event as any}
          onDidDismiss={() => setPopoverState({ open: false, event: null, postId: null })}
        >
          <IonList>
            <IonItem button onClick={() => {
              const post = favoritePosts.find(p => p.post_id === popoverState.postId);
              if (post) startEditingPost(post);
              setPopoverState({ open: false, event: null, postId: null });
            }}>
              <IonIcon icon={pencil} slot="start" />
              <IonLabel>Edit</IonLabel>
            </IonItem>
            <IonItem button onClick={() => {
              if (popoverState.postId) deletePost(popoverState.postId);
              setPopoverState({ open: false, event: null, postId: null });
            }}>
              <IonIcon icon={trash} slot="start" color="danger" />
              <IonLabel color="danger">Delete</IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>

        <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Post</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsModalOpen(false)}>Cancel</IonButton>
                <IonButton strong={true} onClick={savePost}>Save</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '10px' }}>
              <IonTextarea
                value={postContent}
                onIonChange={e => setPostContent(e.detail.value!)}
                placeholder="What's on your mind?"
                rows={6}
                style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={isAlertOpen}
          onDidDismiss={() => setIsAlertOpen(false)}
          header="Success"
          message="Post updated successfully!"
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Favorites;