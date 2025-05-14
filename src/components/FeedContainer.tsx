import { useState, useEffect } from 'react';
import { IonApp, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonInput, IonLabel, IonModal, IonFooter, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonAlert, IonText, IonAvatar, IonCol, IonGrid, IonRow, IonIcon, IonPopover, IonTextarea, IonImg, IonActionSheet } from '@ionic/react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClients';
import { colorFill, pencil, trash, heart, heartOutline, chatbubbleOutline, image, send, camera } from 'ionicons/icons';
import React from 'react';

interface Post {
  post_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  post_content: string;
  post_created_at: string;
  post_updated_at: string;
  image_url?: string;
  reaction_count: number;
  comment_count: number;
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  comment_content: string;
  comment_created_at: string;
}

interface Reaction {
  reaction_id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like';
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [userReactions, setUserReactions] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        console.log('Auth data:', authData);
        
        if (authData?.user?.email) {
          setUser(authData.user);
          
          // First, try to find existing user
          let { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_email', authData.user.email)
            .maybeSingle();

          if (error) {
            console.error('Error fetching user data:', error);
            setAlertMessage('Error fetching user data: ' + error.message);
            setIsAlertOpen(true);
            return;
          }

          if (!userData) {
            console.log('No existing user found, creating new user data for:', authData.user.email);
            // Create new user data with user_id as text
            const { data: newUserData, error: createError } = await supabase
              .from('users')
              .insert([
                {
                  user_id: authData.user.id, // This is already a string from auth.user.id
                  user_email: authData.user.email,
                  username: authData.user.email.split('@')[0],
                  user_avatar_url: 'https://ionicframework.com/docs/img/demos/avatar.svg'
                }
              ])
              .select()
              .single();

            if (createError) {
              console.error('Error creating user data:', createError);
              setAlertMessage('Error creating user profile: ' + createError.message);
              setIsAlertOpen(true);
              return;
            }

            if (newUserData) {
              console.log('Created new user data:', newUserData);
              setUser(authData.user); // Just use the auth user data directly
              setUsername(newUserData.username);
            }
          } else {
            console.log('Found existing user data:', userData);
            setUser(authData.user); // Just use the auth user data directly
            setUsername(userData.username);
          }
        } else {
          console.error('No authenticated user or email found');
          setAlertMessage('Please log in with a valid email to create posts');
          setIsAlertOpen(true);
        }
      } catch (err) {
        console.error('Exception in fetchUser:', err);
        setAlertMessage('Error fetching user data: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setIsAlertOpen(true);
      }
    };

    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('post_created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }

        if (data) {
          console.log('Fetched posts:', data);
          setPosts(data as Post[]);
        }
      } catch (err) {
        console.error('Exception fetching posts:', err);
      }
    };

    fetchUser();
    fetchPosts();
  }, []);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      setAlertMessage('Please select an image file');
      setIsAlertOpen(true);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setAlertMessage('Image size must be less than 5MB');
      setIsAlertOpen(true);
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedImage(file);
    } catch (error) {
      console.error('Error handling image:', error);
      setAlertMessage('Error handling image');
      setIsAlertOpen(true);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL with the full path
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      console.log('Uploaded image URL:', publicUrl); // Debug log
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setAlertMessage('Error uploading image');
      setIsAlertOpen(true);
      return null;
    }
  };

  const createPost = async () => {
    if ((!postContent && !selectedImage) || !user || !username) {
      setAlertMessage('Please add some content or an image to your post');
      setIsAlertOpen(true);
      return;
    }

    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setAlertMessage('Failed to upload image');
          setIsAlertOpen(true);
          return;
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            post_content: postContent,
            user_id: user.id,
            username,
            avatar_url: user.user_metadata?.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg',
            image_url: imageUrl,
            reaction_count: 0,
            comment_count: 0
          }
        ])
        .select('*')
        .single();

      if (error) throw error;

      setPosts([data as Post, ...posts]);
      setPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setAlertMessage('Post created successfully!');
      setIsAlertOpen(true);
    } catch (error) {
      console.error('Error creating post:', error);
      setAlertMessage('Error creating post');
      setIsAlertOpen(true);
    }
  };

  const toggleReaction = async (postId: string) => {
    if (!user) return;

    const hasReacted = userReactions[postId];
    
    if (hasReacted) {
      // Remove reaction
      await supabase
        .from('reactions')
        .delete()
        .match({ user_id: user.id, post_id: postId });
      
      setUserReactions({ ...userReactions, [postId]: false });
      setPosts(posts.map(post => 
        post.post_id === postId 
          ? { ...post, reaction_count: post.reaction_count - 1 }
          : post
      ));
    } else {
      // Add reaction
      await supabase
        .from('reactions')
        .insert([{ user_id: user.id, post_id: postId, reaction_type: 'like' }]);
      
      setUserReactions({ ...userReactions, [postId]: true });
      setPosts(posts.map(post => 
        post.post_id === postId 
          ? { ...post, reaction_count: post.reaction_count + 1 }
          : post
      ));
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('comment_created_at', { ascending: true });

    if (!error && data) {
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !user || !username) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          username,
          avatar_url: user.user_metadata?.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg',
          comment_content: newComment
        }
      ])
      .select('*');

    if (!error && data) {
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data[0]]
      }));
      setNewComment('');
      setPosts(posts.map(post => 
        post.post_id === postId 
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      ));
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
                  rows={3}
                />
                {imagePreview && (
                  <div style={{ 
                    marginTop: '1rem',
                    position: 'relative',
                    width: '100%',
                    maxHeight: '300px',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    backgroundColor: '#f4f4f4',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain'
                      }}
                    />
                    <IonButton
                      fill="clear"
                      color="danger"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        '--background': 'rgba(0,0,0,0.5)'
                      }}
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </div>
                )}
              </IonCardContent>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.5rem' 
              }}>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <IonButton
                  fill="clear"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IonIcon icon={image} slot="start" />
                  Add Image
                </IonButton>
                <IonButton onClick={createPost}>
                  <IonIcon icon={send} slot="start" />
                  Post
                </IonButton>
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
                    {post.user_id === user.id && (
                      <IonCol size="auto">
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
                      </IonCol>
                    )}
                  </IonRow>
                </IonCardHeader>
  
                <IonCardContent>
                  <IonText style={{ color: 'black' }}>
                    <p style={{ 
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      margin: '0 0 1rem 0'
                    }}>{post.post_content}</p>
                  </IonText>
                  {post.image_url && (
                    <div style={{ 
                      marginTop: '1rem',
                      marginBottom: '1rem',
                      width: '100%',
                      maxHeight: '500px',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      backgroundColor: '#f4f4f4',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <img
                        src={post.image_url}
                        alt="Post content"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          console.error('Error loading image:', post.image_url);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', post.image_url);
                        }}
                      />
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '1rem',
                    borderTop: '1px solid #eee',
                    paddingTop: '0.5rem'
                  }}>
                    <div>
                      <IonButton
                        fill="clear"
                        onClick={() => toggleReaction(post.post_id)}
                      >
                        <IonIcon 
                          slot="start" 
                          icon={userReactions[post.post_id] ? heart : heartOutline}
                          color={userReactions[post.post_id] ? "danger" : "medium"}
                        />
                        {post.reaction_count}
                      </IonButton>
                      <IonButton
                        fill="clear"
                        onClick={() => {
                          setShowComments(prev => ({
                            ...prev,
                            [post.post_id]: !prev[post.post_id]
                          }));
                          if (!comments[post.post_id]) {
                            fetchComments(post.post_id);
                          }
                        }}
                      >
                        <IonIcon slot="start" icon={chatbubbleOutline} />
                        {post.comment_count}
                      </IonButton>
                    </div>
                  </div>

                  {showComments[post.post_id] && (
                    <div style={{ marginTop: '1rem' }}>
                      {comments[post.post_id]?.map(comment => (
                        <IonCard key={comment.comment_id} style={{ margin: '0.5rem 0' }}>
                          <IonCardContent>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <IonAvatar style={{ width: '24px', height: '24px', marginRight: '0.5rem' }}>
                                <img src={comment.avatar_url} alt={comment.username} />
                              </IonAvatar>
                              <strong>{comment.username}</strong>
                            </div>
                            <p style={{ margin: '0' }}>{comment.comment_content}</p>
                          </IonCardContent>
                        </IonCard>
                      ))}
                      
                      <div style={{ display: 'flex', marginTop: '1rem' }}>
                        <IonInput
                          value={newComment}
                          onIonChange={e => setNewComment(e.detail.value!)}
                          placeholder="Write a comment..."
                          style={{ flex: 1 }}
                        />
                        <IonButton
                          fill="clear"
                          onClick={() => addComment(post.post_id)}
                        >
                          <IonIcon slot="icon-only" icon={send} />
                        </IonButton>
                      </div>
                    </div>
                  )}
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
          <IonTextarea
            value={postContent}
            onIonChange={e => setPostContent(e.detail.value!)}
            placeholder="Edit your post..."
            rows={3}
          />
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <IonButton slot="end" onClick={savePost}>Save</IonButton>
            <IonButton slot="end" onClick={() => setIsModalOpen(false)}>Cancel</IonButton>
          </IonToolbar>
        </IonFooter>
      </IonModal>
  
      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header="Message"
        message={alertMessage || ''}
        buttons={['OK']}
      />
    </>
  );
};

export default FeedContainer;