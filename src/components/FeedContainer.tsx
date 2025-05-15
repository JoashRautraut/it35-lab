import { useState, useEffect, useRef } from 'react';
import { IonApp, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonInput, IonLabel, IonModal, IonFooter, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonAlert, IonText, IonAvatar, IonCol, IonGrid, IonRow, IonIcon, IonPopover, IonImg, IonTextarea, IonList, IonItem, IonBadge } from '@ionic/react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClients';
import { colorFill, pencil, trash, heart, chatbubble, image, thumbsUp, thumbsDown, happy, bookmark, bookmarkOutline } from 'ionicons/icons';

interface Post {
  post_id: string;
  user_id: number;
  username: string;
  avatar_url: string;
  post_content: string;
  post_created_at: string;
  post_updated_at: string;
  image_url?: string;
  comments?: Comment[];
  reactions?: Reaction[];
  is_favorited?: boolean;
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: number;
  username: string;
  avatar_url: string;
  comment_content: string;
  comment_created_at: string;
}

interface Reaction {
  reaction_id: string;
  post_id: string;
  user_id: number;
  reaction_type: 'like' | 'love' | 'haha';
  created_at: string;
}

const FeedContainer = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [popoverState, setPopoverState] = useState<{ open: boolean; event: Event | null; postId: string | null }>({ open: false, event: null, postId: null });
  
  // New state variables
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email?.endsWith('@nbsc.edu.ph')) {
        setUser(authData.user);
        const { data: userData, error } = await supabase
          .from('users')
          .select('user_id, username, user_avatar_url')
          .eq('user_email', authData.user.email)
          .single();
        if (!error && userData) {
          setUser({ ...authData.user, id: userData.user_id });
          setUsername(userData.username);
        }
      }
    };

    const fetchPosts = async () => {
      try {
        // First get user's favorites
        const { data: { user } } = await supabase.auth.getUser();
        let favoriteSet = new Set<string>();
        
        if (user) {
          const { data: favoritesData } = await supabase
            .from('favorites')
            .select('post_id')
            .eq('user_id', user.id);
          
          favoriteSet = new Set(favoritesData?.map(f => f.post_id) || []);
          setFavorites(favoriteSet);
        }

        // Then fetch posts with all related data
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            comments (
              comment_id,
              user_id,
              username,
              avatar_url,
              comment_content,
              comment_created_at
            ),
            reactions (
              reaction_id,
              user_id,
              reaction_type,
              created_at
            )
          `)
          .order('post_created_at', { ascending: false });
        
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          return;
        }
        
        if (postsData) {
          setPosts(postsData.map(post => ({
            ...post,
            is_favorited: favoriteSet.has(post.post_id)
          })));
        }
      } catch (error) {
        console.error('Error in fetchPosts:', error);
      }
    };

    fetchUser();
    fetchPosts();
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!selectedImage || !user) return null;
    
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };

  const createPost = async () => {
    if (!postContent || !user || !username) return;
    
    try {
      // Upload image if selected
      const imageUrl = await uploadImage();
      
      // Fetch avatar URL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user avatar:', userError);
        return;
      }
      
      const avatarUrl = userData?.user_avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg';
      
      // Insert post with image URL if available
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([
          { 
            post_content: postContent, 
            user_id: user.id, 
            username, 
            avatar_url: avatarUrl,
            image_url: imageUrl 
          }
        ])
        .select(`
          *,
          comments (
            comment_id,
            user_id,
            username,
            avatar_url,
            comment_content,
            comment_created_at
          ),
          reactions (
            reaction_id,
            user_id,
            reaction_type,
            created_at
          )
        `)
        .single();
      
      if (postError) {
        console.error('Error creating post:', postError);
        return;
      }
      
      if (newPost) {
        setPosts([newPost as Post, ...posts]);
        setPostContent('');
        setSelectedImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Error in createPost:', error);
    }
  };

  const deletePost = async (post_id: string) => {
    await supabase.from('posts').delete().match({ post_id });
    setPosts(posts.filter(post => post.post_id !== post_id));
  };

  const startEditingPost = (post: Post) => {
    setEditingPost(post);
    setPostContent(post.post_content);
    setIsModalOpen(true);
  };

  const savePost = async () => {
    if (!postContent || !editingPost) return;
    const { data, error } = await supabase
      .from('posts')
      .update({ post_content: postContent })
      .match({ post_id: editingPost.post_id })
      .select('*');
    if (!error && data) {
      const updatedPost = data[0] as Post;
      setPosts(posts.map(post => (post.post_id === updatedPost.post_id ? updatedPost : post)));
      setPostContent('');
      setEditingPost(null);
      setIsModalOpen(false);
      setIsAlertOpen(true);
    }
  };

  const addComment = async (postId: string) => {
    if (!commentContent || !user || !username) return;
    
    const { data: userData } = await supabase
      .from('users')
      .select('user_avatar_url')
      .eq('user_id', user.id)
      .single();
    
    const avatarUrl = userData?.user_avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg';
    
    const { data: commentData, error } = await supabase
      .from('comments')
      .insert([{
        post_id: postId,
        user_id: user.id,
        username,
        avatar_url: avatarUrl,
        comment_content: commentContent
      }])
      .select('*');
    
    if (!error && commentData) {
      setPosts(posts.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), commentData[0] as Comment]
          };
        }
        return post;
      }));
      setCommentContent('');
      setCommentingPostId(null);
    }
  };

  const addReaction = async (postId: string, reactionType: 'like' | 'love' | 'haha') => {
    if (!user) return;
    
    // Check if user already reacted
    const existingReaction = posts
      .find(p => p.post_id === postId)
      ?.reactions?.find(r => r.user_id === Number(user.id));
    
    if (existingReaction) {
      // Remove existing reaction if it's the same type
      if (existingReaction.reaction_type === reactionType) {
        await supabase
          .from('reactions')
          .delete()
          .match({ reaction_id: existingReaction.reaction_id });
        
        setPosts(posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              reactions: post.reactions?.filter(r => r.reaction_id !== existingReaction.reaction_id)
            };
          }
          return post;
        }));
        return;
      }
      
      // Update reaction type if different
      const { data: updatedReaction, error } = await supabase
        .from('reactions')
        .update({ reaction_type: reactionType })
        .match({ reaction_id: existingReaction.reaction_id })
        .select('*');
      
      if (!error && updatedReaction) {
        setPosts(posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              reactions: post.reactions?.map(r => 
                r.reaction_id === existingReaction.reaction_id 
                  ? updatedReaction[0] as Reaction
                  : r
              )
            };
          }
          return post;
        }));
      }
    } else {
      // Add new reaction
      const { data: newReaction, error } = await supabase
        .from('reactions')
        .insert([{
          post_id: postId,
          user_id: Number(user.id),
          reaction_type: reactionType
        }])
        .select('*');
      
      if (!error && newReaction) {
        setPosts(posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              reactions: [...(post.reactions || []), newReaction[0] as Reaction]
            };
          }
          return post;
        }));
      }
    }
  };

  const toggleFavorite = async (postId: string) => {
    if (!user) return;

    try {
      const isFavorited = favorites.has(postId);
      
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, post_id: postId });

        if (error) throw error;
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, post_id: postId }]);

        if (error) throw error;
        
        setFavorites(prev => new Set([...prev, postId]));
      }

      // Update posts state to reflect the change
      setPosts(posts.map(post => 
        post.post_id === postId 
          ? { ...post, is_favorited: !isFavorited }
          : post
      ));

    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <>
      <IonContent>
        {user ? (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Create Post</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonTextarea
                  value={postContent}
                  onIonChange={e => setPostContent(e.detail.value!)}
                  placeholder="Write a post..."
                  rows={4}
                />
                {imagePreview && (
                  <div style={{ marginTop: '1rem' }}>
                    <IonImg src={imagePreview} style={{ maxHeight: '200px', objectFit: 'cover' }} />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem', gap: '0.5rem' }}>
                <IonButton fill="outline" onClick={() => fileInputRef.current?.click()}>
                  <IonIcon slot="start" icon={image} />
                  Add Image
                </IonButton>
                <IonButton onClick={createPost}>Post</IonButton>
              </div>
            </IonCard>
  
            {posts.map(post => (
              <IonCard key={post.post_id} style={{ marginTop: '2rem' }}>
                <IonCardHeader>
                  <IonRow>
                    <IonCol size="1.85">
                      <IonAvatar>
                        <img alt={post.username} src={post.avatar_url} />
                      </IonAvatar>
                    </IonCol>
                    <IonCol>
                      <IonCardTitle style={{ marginTop: '10px' }}>{post.username}</IonCardTitle>
                      <IonCardSubtitle>{new Date(post.post_created_at).toLocaleString()}</IonCardSubtitle>
                    </IonCol>
                    <IonCol size="auto">
                      {post.user_id === Number(user.id) ? (
                        <IonButton
                          fill="clear"
                          onClick={(e) =>
                            setPopoverState({
                              open: true,
                              event: e.nativeEvent,
                              postId: post.post_id,
                            })
                          }
                        >
                          <IonIcon color="secondary" icon={pencil} />
                        </IonButton>
                      ) : (
                        <IonButton
                          fill="clear"
                          onClick={() => toggleFavorite(post.post_id)}
                        >
                          <IonIcon 
                            color={post.is_favorited ? "warning" : "medium"} 
                            icon={post.is_favorited ? bookmark : bookmarkOutline} 
                          />
                        </IonButton>
                      )}
                    </IonCol>
                  </IonRow>
                </IonCardHeader>
  
                <IonCardContent>
                  <IonText style={{ color: 'black' }}>
                    <h1>{post.post_content}</h1>
                  </IonText>
                  
                  {post.image_url && (
                    <div style={{ marginTop: '1rem' }}>
                      <IonImg src={post.image_url} style={{ maxHeight: '400px', objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Reactions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => addReaction(post.post_id, 'like')}
                      color={post.reactions?.some(r => r.user_id === Number(user.id) && r.reaction_type === 'like') ? 'primary' : 'medium'}
                    >
                      <IonIcon slot="start" icon={thumbsUp} />
                      {post.reactions?.filter(r => r.reaction_type === 'like').length || 0}
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => addReaction(post.post_id, 'love')}
                      color={post.reactions?.some(r => r.user_id === Number(user.id) && r.reaction_type === 'love') ? 'primary' : 'medium'}
                    >
                      <IonIcon slot="start" icon={heart} />
                      {post.reactions?.filter(r => r.reaction_type === 'love').length || 0}
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => addReaction(post.post_id, 'haha')}
                      color={post.reactions?.some(r => r.user_id === Number(user.id) && r.reaction_type === 'haha') ? 'primary' : 'medium'}
                    >
                      <IonIcon slot="start" icon={happy} />
                      {post.reactions?.filter(r => r.reaction_type === 'haha').length || 0}
                    </IonButton>
                  </div>

                  {/* Comments Section */}
                  <div style={{ marginTop: '1rem' }}>
                    <IonList>
                      {post.comments?.map(comment => (
                        <IonItem key={comment.comment_id}>
                          <IonAvatar slot="start">
                            <img alt={comment.username} src={comment.avatar_url} />
                          </IonAvatar>
                          <div>
                            <strong>{comment.username}</strong>
                            <p style={{ margin: '0.25rem 0' }}>{comment.comment_content}</p>
                            <small style={{ color: '#666' }}>
                              {new Date(comment.comment_created_at).toLocaleString()}
                            </small>
                          </div>
                        </IonItem>
                      ))}
                    </IonList>

                    {/* Comment Input */}
                    {commentingPostId === post.post_id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <IonInput
                          placeholder="Write a comment..."
                          value={commentContent}
                          onIonChange={e => setCommentContent(e.detail.value!)}
                        />
                        <IonButton size="small" onClick={() => addComment(post.post_id)}>
                          Send
                        </IonButton>
                        <IonButton
                          size="small"
                          fill="clear"
                          onClick={() => {
                            setCommentingPostId(null);
                            setCommentContent('');
                          }}
                        >
                          Cancel
                        </IonButton>
                      </div>
                    ) : (
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => setCommentingPostId(post.post_id)}
                      >
                        <IonIcon slot="start" icon={chatbubble} />
                        Add Comment
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
  
                <IonPopover
                  isOpen={popoverState.open && popoverState.postId === post.post_id}
                  event={popoverState.event}
                  onDidDismiss={() =>
                    setPopoverState({ open: false, event: null, postId: null })
                  }
                >
                  <IonButton
                    fill="clear"
                    onClick={() => {
                      startEditingPost(post);
                      setPopoverState({ open: false, event: null, postId: null });
                    }}
                  >
                    Edit
                  </IonButton>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={() => {
                      deletePost(post.post_id);
                      setPopoverState({ open: false, event: null, postId: null });
                    }}
                  >
                    Delete
                  </IonButton>
                </IonPopover>
              </IonCard>
            ))}
          </>
        ) : (
          <IonLabel>Loading...</IonLabel>
        )}
      </IonContent>
  
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Post</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonInput
            value={postContent}
            onIonChange={e => setPostContent(e.detail.value!)}
            placeholder="Edit your post..."
          />
        </IonContent>
        <IonFooter>
          <IonButton onClick={savePost}>Save</IonButton>
          <IonButton onClick={() => setIsModalOpen(false)}>Cancel</IonButton>
        </IonFooter>
      </IonModal>
  
      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header="Success"
        message="Post updated successfully!"
        buttons={['OK']}
      />
    </>
  );
};

export default FeedContainer;