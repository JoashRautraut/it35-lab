import { 
  IonButtons,
    IonContent, 
    IonHeader, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
  IonToolbar,
  IonCard,
  IonItem,
  IonAvatar,
  IonLabel,
  IonCardContent,
  IonText,
  IonImg,
  IonButton,
  IonIcon,
  useIonToast,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonActionSheet,
  IonModal,
  IonTextarea,
  IonFooter,
  IonFab,
  IonFabButton,
  IonList,
  IonInput,
  IonProgressBar,
  IonFabList,
  IonBadge,
  IonChip,
  IonPopover,
} from '@ionic/react';
import { bookmark, bookmarkOutline, timeOutline, createOutline, trashOutline, ellipsisHorizontal, addOutline, shareOutline, heart, heartOutline, camera, image, chatbubbleOutline, send } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClients';

interface Post {
  post_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  post_content: string;
  image_url?: string;
  post_created_at: string;
  reaction_count: number;
  comment_count: number;
  has_reacted?: boolean;
}

interface SavedPostResponse {
  post_id: string;
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  comment_content: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [presentToast] = useIonToast();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostData, setNewPostData] = useState({ content: '', image_url: '' });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('post_created_at', { ascending: false });

      if (postsError) throw postsError;
      if (!postsData) return;

      // Get user's reactions
      const { data: reactionsData } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('user_id', user.id);

      // Get user's saved posts
      const { data: savedPostsData } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);

      const userReactions = new Set((reactionsData || []).map(r => r.post_id));
      const userSavedPosts = new Set((savedPostsData || []).map(s => s.post_id));

      // Combine posts with reaction and saved status
      const postsWithStatus = postsData.map(post => ({
        ...post,
        has_reacted: userReactions.has(post.post_id)
      }));

      setPosts(postsWithStatus);
      setSavedPosts(Array.from(userSavedPosts));

    } catch (error) {
      console.error('Error fetching posts:', error);
      presentToast({
        message: 'Error loading posts',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleReaction = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const post = posts.find(p => p.post_id === postId);
      if (!post) return;

      if (post.has_reacted) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .match({ user_id: user.id, post_id: postId });

        if (error) throw error;

        setPosts(current =>
          current.map(p =>
            p.post_id === postId
              ? { ...p, has_reacted: false, reaction_count: p.reaction_count - 1 }
              : p
          )
        );
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert([{ user_id: user.id, post_id: postId }]);

        if (error) throw error;

        setPosts(current =>
          current.map(p =>
            p.post_id === postId
              ? { ...p, has_reacted: true, reaction_count: p.reaction_count + 1 }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      presentToast({
        message: 'Error updating reaction',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleCreatePost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Create post
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            post_content: newPostData.content,
            image_url: newPostData.image_url || null
          }
        ])
        .select()
        .single();

      if (postError) throw postError;
      if (!newPost) throw new Error('Failed to create post');

      setPosts(current => [newPost, ...current]);
      setShowCreateModal(false);
      setNewPostData({ content: '', image_url: '' });

      presentToast({
        message: 'Post created successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      presentToast({
        message: error instanceof Error ? error.message : 'Error creating post',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Create comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            comment_content: newComment
          }
        ])
        .select()
        .single();

      if (commentError) throw commentError;
      if (!comment) throw new Error('Failed to create comment');

      setComments(current => [...current, comment]);
      setNewComment('');

      // The comment count will be updated automatically by the trigger

      presentToast({
        message: 'Comment added successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      presentToast({
        message: error instanceof Error ? error.message : 'Error adding comment',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const toggleSavePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (savedPosts.includes(postId)) {
        // Remove from saved posts
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .match({ user_id: user.id, post_id: postId });

        if (error) throw error;

        setSavedPosts(current => current.filter(id => id !== postId));
        presentToast({
          message: 'Post removed from saved items',
          duration: 2000,
          color: 'success'
        });
      } else {
        // Add to saved posts
        const { error } = await supabase
          .from('saved_posts')
          .insert([{ user_id: user.id, post_id: postId }]);

        if (error) throw error;

        setSavedPosts(current => [...current, postId]);
        presentToast({
          message: 'Post saved successfully',
          duration: 2000,
          color: 'success'
        });
      }
    } catch (error) {
      console.error('Error toggling save post:', error);
      presentToast({
        message: 'Error saving post',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handlePostAction = (post: Post) => {
    setSelectedPost(post);
    setShowActionSheet(true);
  };

  const handleEditPost = () => {
    if (selectedPost) {
      setEditContent(selectedPost.post_content);
      setShowEditModal(true);
    }
  };

  const saveEditedPost = async () => {
    try {
      if (!selectedPost) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Only allow editing if the user owns the post
      if (selectedPost.user_id !== user.id) {
        throw new Error('You can only edit your own posts');
      }

      const { error } = await supabase
        .from('posts')
        .update({ post_content: editContent })
        .eq('post_id', selectedPost.post_id);

      if (error) throw error;

      setPosts(current =>
        current.map(post =>
          post.post_id === selectedPost.post_id
            ? { ...post, post_content: editContent }
            : post
        )
      );

      setShowEditModal(false);
      presentToast({
        message: 'Post updated successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      presentToast({
        message: 'Error updating post',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleDeletePost = async () => {
    try {
      if (!selectedPost) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Only allow deletion if the user owns the post
      if (selectedPost.user_id !== user.id) {
        throw new Error('You can only delete your own posts');
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('post_id', selectedPost.post_id);

      if (error) throw error;

      setPosts(current => current.filter(post => post.post_id !== selectedPost.post_id));
      setShowActionSheet(false);
      presentToast({
        message: 'Post deleted successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      presentToast({
        message: 'Error deleting post',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(0);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Update progress manually since onUploadProgress is not supported
      setUploadProgress(100);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Set the image URL in the new post form
      setNewPostData(prev => ({ ...prev, image_url: publicUrl }));

      presentToast({
        message: 'Image uploaded successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      presentToast({
        message: 'Error uploading image',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      presentToast({
        message: 'Error loading comments',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || '');
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Add hidden file input for image upload
  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleImageUpload({ target } as React.ChangeEvent<HTMLInputElement>);
      }
    };
    document.body.appendChild(input);
    
    // Store the reference to the input element
    if (fileInputRef) {
      fileInputRef.current = input;
    }
    
    return () => {
      document.body.removeChild(input);
      if (fileInputRef) {
        fileInputRef.current = null;
      }
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Feed</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {posts.map(post => (
          <IonItemSliding key={post.post_id}>
            <IonItem>
              <IonCard style={{ width: '100%', margin: 0 }}>
                <IonItem lines="none">
                  <IonAvatar slot="start">
                    <img src={post.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={post.username} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{post.username}</h2>
                    <p>
                      <IonIcon icon={timeOutline} style={{ marginRight: '5px' }} />
                      {new Date(post.post_created_at).toLocaleString()}
                    </p>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => handleReaction(post.post_id)}
                  >
                    <IonIcon
                      slot="icon-only"
                      icon={post.has_reacted ? heart : heartOutline}
                      color={post.has_reacted ? "danger" : ""}
                    />
                    {post.reaction_count > 0 && (
                      <IonBadge color="danger" style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
                        {post.reaction_count}
                      </IonBadge>
                    )}
                  </IonButton>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => toggleSavePost(post.post_id)}
                  >
                    <IonIcon
                      slot="icon-only"
                      icon={savedPosts.includes(post.post_id) ? bookmark : bookmarkOutline}
                      color={savedPosts.includes(post.post_id) ? "primary" : ""}
                    />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => handlePostAction(post)}
                  >
                    <IonIcon slot="icon-only" icon={ellipsisHorizontal} />
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
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '1rem' 
                  }}>
                    <div>
                      <IonButton
                        fill="clear"
                        onClick={() => {
                          setSelectedPostId(post.post_id);
                          fetchComments(post.post_id);
                          setShowComments(true);
                        }}
                      >
                        <IonIcon
                          slot="start"
                          icon={chatbubbleOutline}
                        />
                        {post.comment_count || 0}
                      </IonButton>
                    </div>
                    <IonButton
                      fill="clear"
                      onClick={() => toggleSavePost(post.post_id)}
                    >
                      <IonIcon
                        slot="icon-only"
                        icon={savedPosts.includes(post.post_id) ? bookmark : bookmarkOutline}
                        color={savedPosts.includes(post.post_id) ? "primary" : ""}
                      />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonItem>
            <IonItemOptions side="end">
              {post.user_id === currentUserId && (
                <>
                  <IonItemOption onClick={() => handlePostAction(post)}>
                    <IonIcon slot="icon-only" icon={createOutline} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => handlePostAction(post)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonItemOption>
                </>
              )}
              <IonItemOption onClick={() => handlePostAction(post)}>
                <IonIcon slot="icon-only" icon={shareOutline} />
              </IonItemOption>
            </IonItemOptions>
          </IonItemSliding>
        ))}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowCreateModal(true)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => {
            setShowActionSheet(false);
            setSelectedPost(null);
          }}
          buttons={[
            ...(selectedPost?.user_id === currentUserId
              ? [
                  {
                    text: 'Edit Post',
                    icon: createOutline,
                    handler: handleEditPost
                  },
                  {
                    text: 'Delete Post',
                    icon: trashOutline,
                    role: 'destructive',
                    handler: handleDeletePost
                  }
                ]
              : []),
            {
              text: 'Share',
              icon: shareOutline,
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

        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Post</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Cancel</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '1rem' }}>
              <IonTextarea
                value={editContent}
                onIonChange={e => setEditContent(e.detail.value || '')}
                placeholder="What's on your mind?"
                rows={6}
                style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="block"
                onClick={saveEditedPost}
                style={{ margin: '0.5rem' }}
              >
                Save Changes
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create Post</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>Cancel</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList style={{ padding: '1rem' }}>
              <IonItem>
                <IonTextarea
                  value={newPostData.content}
                  onIonChange={e => setNewPostData(prev => ({ ...prev, content: e.detail.value || '' }))}
                  placeholder="What's on your mind?"
                  rows={6}
                />
              </IonItem>
              {isUploading && (
                <IonItem>
                  <IonProgressBar value={uploadProgress / 100} />
                </IonItem>
              )}
              {newPostData.image_url && (
                <IonItem>
                  <IonImg src={newPostData.image_url} style={{ maxHeight: '200px', objectFit: 'cover' }} />
                </IonItem>
              )}
              <IonItem>
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IonIcon slot="start" icon={image} />
                  {newPostData.image_url ? 'Change Image' : 'Add Image'}
                </IonButton>
              </IonItem>
            </IonList>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="block"
                onClick={handleCreatePost}
                style={{ margin: '0.5rem' }}
                disabled={!newPostData.content.trim() || isUploading}
              >
                Create Post
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonModal
          isOpen={showComments}
          onDidDismiss={() => {
            setShowComments(false);
            setSelectedPostId(null);
            setComments([]);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comments</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowComments(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {comments.map(comment => (
                <IonItem key={comment.comment_id}>
                  <IonAvatar slot="start">
                    <img src={comment.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={comment.username} />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{comment.username}</h2>
                    <p>{comment.comment_content}</p>
                    <p>
                      <small>
                        {new Date(comment.created_at).toLocaleString()}
                      </small>
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonItem>
                <IonInput
                  value={newComment}
                  placeholder="Write a comment..."
                  onIonChange={e => setNewComment(e.detail.value || '')}
                />
                <IonButton
                  slot="end"
                  fill="clear"
                  onClick={() => selectedPostId && handleAddComment(selectedPostId)}
                  disabled={!newComment.trim()}
                >
                  <IonIcon slot="icon-only" icon={send} />
                </IonButton>
              </IonItem>
            </IonToolbar>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Feed;